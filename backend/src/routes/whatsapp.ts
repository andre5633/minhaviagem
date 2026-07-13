import { Router, type Request } from 'express';
import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import {
  DISPLAY_NUMBER,
  VERIFY_TOKEN,
  parseInbound,
  sendText,
  validSignature,
  whatsappConfigured,
} from '../lib/whatsapp';
import { AGENT_MODEL, agentConfigured, runAgent } from '../lib/agent';

export const whatsappRouter = Router();

const CODE_TTL_MS = 15 * 60 * 1000;
const HISTORY_TURNS = 20;

/** Tetos padrão quando o cliente não tem AiSettings próprio (ajustáveis no admin). */
const DEFAULT_MESSAGE_CAP = Number(process.env.AI_DEFAULT_MONTHLY_MESSAGE_CAP ?? 300);
const DEFAULT_COST_CAP_USD = Number(process.env.AI_DEFAULT_MONTHLY_COST_CAP_USD ?? 10);

function startOfMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

// ============================================================ webhook (Meta)

// Handshake de verificação: a Meta chama uma vez, ao salvar a URL no painel.
whatsappRouter.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    res.status(200).send(String(challenge ?? ''));
    return;
  }
  res.sendStatus(403);
});

// Mensagens recebidas.
whatsappRouter.post('/webhook', (req: Request, res) => {
  const raw = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!raw || !validSignature(raw, req.header('x-hub-signature-256'))) {
    res.sendStatus(401);
    return;
  }

  // A Meta exige 200 em poucos segundos, senão reenvia o mesmo evento. Respondemos
  // já e processamos depois — a deduplicação por waMessageId cobre reenvios.
  res.sendStatus(200);

  for (const msg of parseInbound(req.body)) {
    void handleInbound(msg).catch((err) => console.error('[whatsapp] erro ao processar:', err));
  }
});

async function handleInbound(msg: { waId: string; messageId: string; type: string; text: string }) {
  const link = await prisma.whatsAppLink.findFirst({
    where: { waId: msg.waId, verifiedAt: { not: null } },
    include: { user: true },
  });

  // --- número ainda não vinculado: só aceitamos o código de pareamento
  if (!link) {
    await tryPair(msg);
    return;
  }

  if (msg.type !== 'text' || !msg.text.trim()) {
    await sendText(msg.waId, 'Por enquanto eu só entendo mensagens de texto. 🙂');
    return;
  }

  // Deduplicação: se a Meta reenviou o mesmo evento, o insert falha e paramos aqui.
  try {
    await prisma.waMessage.create({
      data: { userId: link.userId, waMessageId: msg.messageId, role: 'user', text: msg.text },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return; // já processada
    throw err;
  }

  const bloqueio = await checkQuota(link.userId);
  if (bloqueio) {
    await sendText(msg.waId, bloqueio);
    return;
  }

  if (!agentConfigured()) {
    await sendText(msg.waId, 'O assistente está temporariamente indisponível.');
    return;
  }

  // Histórico da conversa (últimas mensagens, mais antigas primeiro).
  const rows = await prisma.waMessage.findMany({
    where: { userId: link.userId },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_TURNS,
  });
  const history = rows.reverse().map((r) => ({ role: r.role, text: r.text }));

  const result = await runAgent(link.userId, link.user.name, history);

  await prisma.aiUsage.create({
    data: {
      userId: link.userId,
      model: AGENT_MODEL,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      cacheReadTokens: result.cacheReadTokens,
      costUsd: new Prisma.Decimal(result.costUsd.toFixed(6)),
    },
  });

  await prisma.waMessage.create({
    data: { userId: link.userId, role: 'assistant', text: result.reply },
  });

  await sendText(msg.waId, result.reply);
}

/** Número desconhecido: aceita um código de 6 dígitos gerado no Perfil. */
async function tryPair(msg: { waId: string; text: string }) {
  const code = msg.text.trim().match(/\b(\d{6})\b/)?.[1];

  if (!code) {
    await sendText(
      msg.waId,
      'Olá! Este número é o assistente do *Minha Viagem Organizada*.\n\nPara conectar, entre no app em Perfil › WhatsApp, gere o código de 6 dígitos e me envie aqui.',
    );
    return;
  }

  const pending = await prisma.whatsAppLink.findFirst({
    where: { code, verifiedAt: null, codeExpiresAt: { gt: new Date() } },
    include: { user: true },
  });

  if (!pending) {
    await sendText(msg.waId, 'Código inválido ou expirado. Gere um novo no app em Perfil › WhatsApp.');
    return;
  }

  // Um wa_id só pode estar em um vínculo (waId é único) — limpa vínculo antigo do mesmo número.
  await prisma.whatsAppLink.updateMany({
    where: { waId: msg.waId },
    data: { waId: null, verifiedAt: null },
  });

  await prisma.whatsAppLink.update({
    where: { id: pending.id },
    data: { waId: msg.waId, verifiedAt: new Date(), code: null, codeExpiresAt: null },
  });

  await sendText(
    msg.waId,
    `Pronto, ${pending.user.name.split(' ')[0]}! Conectado. ✅\n\nPode me perguntar sobre suas viagens — orçamento, saldo, gastos, checklist — ou mandar uma despesa tipo "gastei 80 no almoço".`,
  );
}

/** Retorna a mensagem de bloqueio, ou null se o cliente pode usar o agente. */
async function checkQuota(userId: string): Promise<string | null> {
  const settings = await prisma.aiSettings.findUnique({ where: { userId } });
  if (settings && !settings.enabled) {
    return 'O assistente está desativado para a sua conta. Fale com o suporte.';
  }

  const messageCap = settings?.monthlyMessageCap ?? DEFAULT_MESSAGE_CAP;
  const costCap = settings?.monthlyCostCapUsd ? Number(settings.monthlyCostCapUsd) : DEFAULT_COST_CAP_USD;
  const since = startOfMonth();

  const usage = await prisma.aiUsage.aggregate({
    where: { userId, createdAt: { gte: since } },
    _count: true,
    _sum: { costUsd: true },
  });

  if (messageCap > 0 && usage._count >= messageCap) {
    return 'Você atingiu o limite de mensagens do assistente deste mês. Ele volta a funcionar no dia 1º.';
  }
  if (costCap > 0 && Number(usage._sum.costUsd ?? 0) >= costCap) {
    return 'Você atingiu o limite de uso do assistente deste mês. Ele volta a funcionar no dia 1º.';
  }
  return null;
}

// ==================================================== vínculo (usuário logado)

whatsappRouter.get('/link', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const link = await prisma.whatsAppLink.findUnique({ where: { userId } });

  res.json({
    configured: whatsappConfigured() && agentConfigured(),
    displayNumber: DISPLAY_NUMBER,
    connected: Boolean(link?.verifiedAt),
    phone: link?.phone ?? null,
    verifiedAt: link?.verifiedAt?.toISOString() ?? null,
    code: link?.verifiedAt || !link?.codeExpiresAt || link.codeExpiresAt < new Date() ? null : link.code,
    codeExpiresAt: link?.codeExpiresAt?.toISOString() ?? null,
  });
});

// Gera (ou renova) o código de pareamento.
whatsappRouter.post('/link', requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim().slice(0, 30) : null;

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const codeExpiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.whatsAppLink.upsert({
    where: { userId },
    create: { userId, phone, code, codeExpiresAt },
    update: { phone, code, codeExpiresAt, waId: null, verifiedAt: null },
  });

  res.json({ code, codeExpiresAt: codeExpiresAt.toISOString(), displayNumber: DISPLAY_NUMBER });
});

whatsappRouter.delete('/link', requireAuth, async (req, res) => {
  await prisma.whatsAppLink.deleteMany({ where: { userId: req.user!.id } });
  res.json({ ok: true });
});
