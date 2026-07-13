import { createHmac, timingSafeEqual } from 'crypto';

const GRAPH_VERSION = 'v22.0';

export const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? '';
export const APP_SECRET = process.env.WHATSAPP_APP_SECRET ?? '';
export const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
export const TOKEN = process.env.WHATSAPP_TOKEN ?? '';

/** Número exibido ao usuário no Perfil (só para ele saber pra quem mandar o código). */
export const DISPLAY_NUMBER = process.env.WHATSAPP_DISPLAY_NUMBER ?? '';

export function whatsappConfigured(): boolean {
  return Boolean(VERIFY_TOKEN && APP_SECRET && PHONE_NUMBER_ID && TOKEN);
}

/**
 * Valida o X-Hub-Signature-256 da Meta (HMAC-SHA256 do corpo CRU com o App Secret).
 * Sem isso, qualquer um que descubra a URL consegue injetar mensagens no agente.
 */
export function validSignature(rawBody: Buffer, header: string | undefined): boolean {
  if (!APP_SECRET || !header?.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', APP_SECRET).update(rawBody).digest();
  const got = Buffer.from(header.slice('sha256='.length), 'hex');
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}

/** Limite de caracteres de uma mensagem de texto do WhatsApp. */
const MAX_CHARS = 4000;

export async function sendText(to: string, body: string): Promise<void> {
  const text = body.length > MAX_CHARS ? `${body.slice(0, MAX_CHARS - 1)}…` : body;

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text, preview_url: false },
    }),
  });

  if (!res.ok) {
    console.error('[whatsapp] falha ao enviar:', res.status, await res.text());
  }
}

// ---- formato do webhook (só o que usamos) ----

export interface InboundMessage {
  waId: string; // remetente
  messageId: string;
  type: string;
  text: string;
}

/** Extrai as mensagens de texto de um payload de webhook da Meta. */
export function parseInbound(payload: unknown): InboundMessage[] {
  const out: InboundMessage[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return out;

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] }).changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = (change as { value?: { messages?: unknown[] } }).value;
      const messages = value?.messages;
      if (!Array.isArray(messages)) continue; // status de entrega, etc.

      for (const m of messages as Array<{
        from?: string;
        id?: string;
        type?: string;
        text?: { body?: string };
      }>) {
        if (!m.from || !m.id) continue;
        out.push({
          waId: m.from,
          messageId: m.id,
          type: m.type ?? 'unknown',
          text: m.text?.body ?? '',
        });
      }
    }
  }
  return out;
}
