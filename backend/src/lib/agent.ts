import Anthropic from '@anthropic-ai/sdk';
import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { ensureCategories } from '../routes/categories';

const MODEL = 'claude-opus-4-8';

/** US$ por 1M de tokens (Opus 4.8). Cache read = 0.1x do input. */
const PRICE_PER_MTOK = { input: 5, output: 25, cacheRead: 0.5 };

const anthropic = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente

export function agentConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const brl = (v: Prisma.Decimal | number) => `R$ ${Number(v).toFixed(2)}`;
const day = (d: Date) => d.toISOString().slice(0, 10);

// ---------------------------------------------------------------- ferramentas
// Todas fecham sobre o userId do vínculo — nenhuma consulta aceita userId como
// argumento, então o agente não tem como olhar dados de outro usuário nem se
// for instruído a isso por uma mensagem maliciosa.
function toolsFor(userId: string) {
  const ownTrip = (id: string) => prisma.trip.findFirst({ where: { id, userId } });

  const listarViagens = betaTool({
    name: 'listar_viagens',
    description:
      'Lista as viagens do usuário com id, título, destino, datas e orçamento. Use primeiro para descobrir o id de uma viagem citada pelo nome.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async () => {
      const trips = await prisma.trip.findMany({ where: { userId }, orderBy: { startDate: 'desc' } });
      if (!trips.length) return 'O usuário ainda não tem nenhuma viagem cadastrada.';
      return trips
        .map(
          (t) =>
            `id=${t.id} | ${t.title} | destino: ${t.destination} | ${day(t.startDate)} a ${day(t.endDate)} | orçamento ${brl(t.totalBudget)}`,
        )
        .join('\n');
    },
  });

  const detalharViagem = betaTool({
    name: 'detalhar_viagem',
    description:
      'Resumo financeiro de uma viagem: orçamento, total gasto, saldo restante e o gasto acumulado por categoria.',
    inputSchema: {
      type: 'object',
      properties: { tripId: { type: 'string', description: 'id da viagem (venha de listar_viagens)' } },
      required: ['tripId'],
      additionalProperties: false,
    },
    run: async ({ tripId }) => {
      const trip = await ownTrip(tripId);
      if (!trip) return 'Viagem não encontrada.';

      const expenses = await prisma.expense.findMany({ where: { tripId } });
      const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const budget = Number(trip.totalBudget);

      const byCat = new Map<string, number>();
      for (const e of expenses) byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount));

      const cats = await prisma.category.findMany({ where: { userId } });
      const label = (key: string) => cats.find((c) => c.key === key)?.name ?? key;

      const linhas = [...byCat.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key, v]) => `- ${label(key)}: ${brl(v)}`)
        .join('\n');

      return [
        `${trip.title} (${trip.destination}), ${day(trip.startDate)} a ${day(trip.endDate)}`,
        `Orçamento: ${brl(budget)}`,
        `Gasto: ${brl(total)}`,
        `Saldo: ${brl(budget - total)}`,
        `Lançamentos: ${expenses.length}`,
        linhas ? `Por categoria:\n${linhas}` : 'Nenhuma despesa lançada ainda.',
      ].join('\n');
    },
  });

  const listarDespesas = betaTool({
    name: 'listar_despesas',
    description: 'Últimas despesas de uma viagem (mais recentes primeiro).',
    inputSchema: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        limite: { type: 'integer', description: 'quantas trazer (padrão 15, máximo 50)' },
      },
      required: ['tripId'],
      additionalProperties: false,
    },
    run: async ({ tripId, limite }) => {
      const trip = await ownTrip(tripId);
      if (!trip) return 'Viagem não encontrada.';

      const take = Math.min(50, Math.max(1, limite ?? 15));
      const expenses = await prisma.expense.findMany({
        where: { tripId },
        orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
        take,
      });
      if (!expenses.length) return 'Nenhuma despesa lançada nessa viagem.';

      const cats = await prisma.category.findMany({ where: { userId } });
      const label = (key: string) => cats.find((c) => c.key === key)?.name ?? key;

      return expenses
        .map((e) => `${day(e.expenseDate)} | ${label(e.category)} | ${e.description} | ${brl(e.amount)}`)
        .join('\n');
    },
  });

  const checklistPendente = betaTool({
    name: 'checklist_pendente',
    description: 'Tarefas ainda não concluídas do checklist de uma viagem, agrupadas por lista.',
    inputSchema: {
      type: 'object',
      properties: { tripId: { type: 'string' } },
      required: ['tripId'],
      additionalProperties: false,
    },
    run: async ({ tripId }) => {
      const trip = await ownTrip(tripId);
      if (!trip) return 'Viagem não encontrada.';

      const lists = await prisma.checklist.findMany({
        where: { tripId, hidden: false },
        orderBy: { position: 'asc' },
        include: { tasks: { where: { done: false }, orderBy: { position: 'asc' } } },
      });

      const blocos = lists
        .filter((l) => l.tasks.length)
        .map((l) => `${l.title}:\n${l.tasks.map((t) => `- ${t.text}`).join('\n')}`);

      return blocos.length ? blocos.join('\n\n') : 'Nenhuma tarefa pendente — o checklist está todo concluído.';
    },
  });

  const cotacoes = betaTool({
    name: 'cotacoes',
    description: 'Cotação atual das principais moedas em relação ao real (mesma fonte do painel do app).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async () => {
      const rows = await prisma.currencyRate.findMany();
      if (!rows.length) return 'Cotações ainda não disponíveis.';
      const quando = rows[0].fetchedAt.toISOString();
      return [
        ...rows.map((r) => `1 ${r.code} = ${brl(r.rate)}${r.pctChange ? ` (${r.pctChange}%)` : ''}`),
        `Atualizado em ${quando}.`,
      ].join('\n');
    },
  });

  const lancarDespesa = betaTool({
    name: 'lancar_despesa',
    description:
      'GRAVA uma despesa na viagem. Só chame DEPOIS que o usuário confirmou explicitamente na conversa os quatro campos (viagem, categoria, descrição, valor). Nunca chame na mesma mensagem em que você propôs o lançamento.',
    inputSchema: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        categoria: { type: 'string', description: 'chave da categoria (a lista está no prompt do sistema)' },
        descricao: { type: 'string' },
        valor: { type: 'number', description: 'em reais, positivo' },
        data: { type: 'string', description: 'AAAA-MM-DD; se omitido usa hoje' },
        confirmado: {
          type: 'boolean',
          description: 'true apenas se o usuário respondeu confirmando o lançamento nesta conversa',
        },
      },
      required: ['tripId', 'categoria', 'descricao', 'valor', 'confirmado'],
      additionalProperties: false,
    },
    run: async ({ tripId, categoria, descricao, valor, data, confirmado }) => {
      if (!confirmado) {
        return 'NÃO GRAVADO: o usuário ainda não confirmou. Mostre o resumo do lançamento e pergunte se pode confirmar.';
      }
      const trip = await ownTrip(tripId);
      if (!trip) return 'Viagem não encontrada.';
      if (!(valor > 0)) return 'Valor inválido: precisa ser maior que zero.';

      const cat = await prisma.category.findFirst({ where: { userId, key: categoria } });
      if (!cat) return `Categoria "${categoria}" não existe. Peça ao usuário para escolher uma da lista.`;

      const quando = data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? new Date(`${data}T00:00:00Z`) : new Date();

      const created = await prisma.expense.create({
        data: {
          tripId,
          category: cat.key,
          description: descricao.trim(),
          amount: new Prisma.Decimal(valor.toFixed(2)),
          expenseDate: quando,
        },
      });

      const gasto = await prisma.expense.aggregate({ where: { tripId }, _sum: { amount: true } });
      const saldo = Number(trip.totalBudget) - Number(gasto._sum.amount ?? 0);

      return `Despesa gravada (${day(created.expenseDate)}, ${cat.name}, ${created.description}, ${brl(created.amount)}). Saldo da viagem agora: ${brl(saldo)}.`;
    },
  });

  return [listarViagens, detalharViagem, listarDespesas, checklistPendente, cotacoes, lancarDespesa];
}

// ------------------------------------------------------------- prompt/sistema
async function systemPrompt(userId: string, userName: string): Promise<string> {
  await ensureCategories(userId); // semeia as padrão se for o 1º acesso do usuário
  const cats = await prisma.category.findMany({ where: { userId }, orderBy: { position: 'asc' } });
  const lista = cats.map((c) => `${c.key} (${c.name})`).join(', ');

  return `Você é o assistente do Minha Viagem Organizada — um app de controle de orçamento de viagens — e conversa com ${userName} pelo WhatsApp.

Seu papel é responder sobre as viagens dele (orçamento, gastos, saldo, checklist) e lançar despesas quando ele pedir. Você também explica como usar o app quando perguntarem.

Hoje é ${day(new Date())}.
Categorias de despesa deste usuário (use a CHAVE, não o nome, ao lançar): ${lista}.

Como responder:
- WhatsApp, não relatório. Frases curtas, no máximo uns 5 ou 6 linhas. Nada de markdown, tabelas ou títulos — no WhatsApp isso vira lixo visual. Use no máximo *negrito* com asteriscos simples e quebras de linha.
- Valores sempre em reais, no formato R$ 1.234,56.
- Se a pergunta não deixa claro de qual viagem se trata e ele tem mais de uma, pergunte antes de responder.
- Nunca invente número: se não veio de uma ferramenta, você não sabe.

Para lançar despesa (regra rígida):
1. Monte o lançamento (viagem, categoria, descrição, valor) e mostre para ele confirmar.
2. Só depois que ele responder confirmando é que você chama lancar_despesa com confirmado=true.
Nunca grave sem essa confirmação, mesmo que ele pareça com pressa.

Se pedirem algo fora do escopo do app, diga com naturalidade que você só cuida das viagens dele aqui.`;
}

// ------------------------------------------------------------------- execução
export interface AgentResult {
  reply: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  costUsd: number;
}

/**
 * Roda o agente sobre o histórico da conversa e devolve a resposta + o consumo.
 * O tool runner do SDK cuida do loop (pedido → ferramenta → resultado → pedido).
 */
export async function runAgent(
  userId: string,
  userName: string,
  history: Array<{ role: string; text: string }>,
): Promise<AgentResult> {
  const system = await systemPrompt(userId, userName);

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: m.text,
  }));

  const runner = anthropic.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 1024, // resposta de WhatsApp é curta por natureza
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' }, // latência importa: o usuário está esperando no chat
    system,
    messages,
    tools: toolsFor(userId),
    max_iterations: 8,
  });

  let input = 0;
  let output = 0;
  let cacheRead = 0;
  let last: Anthropic.Beta.BetaMessage | undefined;

  // Cada iteração é uma chamada à API; somamos o consumo de todas.
  for await (const message of runner) {
    last = message;
    input += message.usage.input_tokens ?? 0;
    output += message.usage.output_tokens ?? 0;
    cacheRead += message.usage.cache_read_input_tokens ?? 0;
  }

  const reply =
    last?.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim() ?? '';

  const costUsd =
    (input * PRICE_PER_MTOK.input + output * PRICE_PER_MTOK.output + cacheRead * PRICE_PER_MTOK.cacheRead) / 1e6;

  return {
    reply: reply || 'Não consegui responder agora. Pode repetir?',
    inputTokens: input,
    outputTokens: output,
    cacheReadTokens: cacheRead,
    costUsd,
  };
}

export const AGENT_MODEL = MODEL;
