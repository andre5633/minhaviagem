import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createHash, timingSafeEqual } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

const SECRET = process.env.JWT_SECRET!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

const COOKIE = 'mv_admin';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60 * 1000, // 8h
};

function sha256(s: string): Buffer {
  return createHash('sha256').update(s).digest();
}

// Comparação constant-time (hashes de mesmo tamanho)
function passwordMatches(input: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  const a = sha256(input);
  const b = sha256(ADMIN_PASSWORD);
  return timingSafeEqual(a, b);
}

// Rate limit simples em memória por IP (anti brute-force)
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 5 * 60 * 1000;
function tooMany(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) return false;
  return rec.count >= MAX_ATTEMPTS;
}
function bump(ip: string): void {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    rec.count += 1;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[COOKIE];
  if (!token) {
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }
  try {
    const payload = jwt.verify(token, SECRET) as { admin?: boolean };
    if (!payload.admin) throw new Error('not admin');
    next();
  } catch {
    res.clearCookie(COOKIE);
    res.status(401).json({ error: 'Sessão expirada' });
  }
}

export const adminRouter = Router();

adminRouter.post('/login', (req, res) => {
  const ip = req.ip ?? 'unknown';
  if (tooMany(ip)) {
    res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
    return;
  }
  const { password } = req.body;
  if (typeof password !== 'string' || !passwordMatches(password)) {
    bump(ip);
    res.status(401).json({ error: 'Senha incorreta' });
    return;
  }
  attempts.delete(ip);
  const token = jwt.sign({ admin: true }, SECRET, { expiresIn: '8h' });
  res.cookie(COOKIE, token, COOKIE_OPTS);
  res.json({ ok: true });
});

adminRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

adminRouter.get('/me', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date | null;
  lastLoginAt: Date | null;
  lastCreate: Date | null;
}

const SORT_MAP: Record<string, string> = {
  createdAt: 'u.created_at',
  lastLoginAt: 'u.last_login_at',
  name: 'u.name',
  email: 'u.email',
  lastCreate: '"lastCreate"',
};

// Colunas (inclui "lastCreate" = data do último trip/expense do usuário)
const USER_SELECT = Prisma.sql`
  u.id, u.name, u.email, u.created_at AS "createdAt", u.last_login_at AS "lastLoginAt",
  GREATEST(
    COALESCE((SELECT max(t.created_at) FROM trips t WHERE t.user_id = u.id), to_timestamp(0)),
    COALESCE((SELECT max(e.created_at) FROM expenses e JOIN trips t ON t.id = e.trip_id WHERE t.user_id = u.id), to_timestamp(0))
  ) AS "lastCreate"
`;

function mapRow(r: AdminUserRow) {
  const lastCreate = r.lastCreate ? new Date(r.lastCreate) : null;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : null,
    lastCreate: lastCreate && lastCreate.getTime() > 0 ? lastCreate.toISOString() : null,
  };
}

adminRouter.get('/users', requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(5, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
  const q = String(req.query.q ?? '').trim();
  const search = q ? `%${q}%` : '%';
  const offset = (page - 1) * pageSize;

  const sortCol = SORT_MAP[String(req.query.sort ?? '')] ?? 'u.created_at';
  const dir = String(req.query.order ?? 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const totalRows = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT count(*)::int AS count FROM users u
    WHERE u.name ILIKE ${search} OR u.email ILIKE ${search}
  `);
  const total = totalRows[0]?.count ?? 0;

  const rows = await prisma.$queryRaw<AdminUserRow[]>(Prisma.sql`
    SELECT ${USER_SELECT}
    FROM users u
    WHERE u.name ILIKE ${search} OR u.email ILIKE ${search}
    ORDER BY ${Prisma.raw(sortCol)} ${Prisma.raw(dir)} NULLS LAST
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  res.json({ data: rows.map(mapRow), total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
});

// Exportação: todos do filtro (all=true&q=) ou por ids (ids=a,b,c)
adminRouter.get('/users/export', requireAdmin, async (req, res) => {
  const all = String(req.query.all) === 'true';
  const q = String(req.query.q ?? '').trim();
  const search = q ? `%${q}%` : '%';

  let rows: AdminUserRow[];
  if (all) {
    rows = await prisma.$queryRaw<AdminUserRow[]>(Prisma.sql`
      SELECT ${USER_SELECT}
      FROM users u
      WHERE u.name ILIKE ${search} OR u.email ILIKE ${search}
      ORDER BY u.created_at DESC
    `);
  } else {
    const ids = String(req.query.ids ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!ids.length) {
      res.json([]);
      return;
    }
    rows = await prisma.$queryRaw<AdminUserRow[]>(Prisma.sql`
      SELECT ${USER_SELECT}
      FROM users u
      WHERE u.id IN (${Prisma.join(ids)})
      ORDER BY u.created_at DESC
    `);
  }
  res.json(rows.map(mapRow));
});

// ==================================== IA / WhatsApp: consumo e limite por cliente

const DEFAULT_MESSAGE_CAP = Number(process.env.AI_DEFAULT_MONTHLY_MESSAGE_CAP ?? 300);
const DEFAULT_COST_CAP_USD = Number(process.env.AI_DEFAULT_MONTHLY_COST_CAP_USD ?? 10);

function startOfMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

interface AiRow {
  id: string;
  name: string;
  email: string;
  waConnected: boolean;
  enabled: boolean | null;
  monthlyMessageCap: number | null;
  monthlyCostCapUsd: string | null;
  monthMessages: number;
  monthCostUsd: string | null;
  totalMessages: number;
  totalCostUsd: string | null;
  lastUsedAt: Date | null;
}

// Uma linha por usuário: se está conectado no WhatsApp, se o agente está ligado,
// os tetos, e o consumo (mês corrente e acumulado).
adminRouter.get('/ai', requireAdmin, async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(5, parseInt(String(req.query.pageSize ?? '20'), 10) || 20));
  const q = String(req.query.q ?? '').trim();
  const search = q ? `%${q}%` : '%';
  const offset = (page - 1) * pageSize;
  const since = startOfMonth();

  const totalRows = await prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
    SELECT count(*)::int AS count FROM users u
    WHERE u.name ILIKE ${search} OR u.email ILIKE ${search}
  `);
  const total = totalRows[0]?.count ?? 0;

  const rows = await prisma.$queryRaw<AiRow[]>(Prisma.sql`
    SELECT
      u.id, u.name, u.email,
      (w.verified_at IS NOT NULL) AS "waConnected",
      s.enabled AS "enabled",
      s.monthly_message_cap AS "monthlyMessageCap",
      s.monthly_cost_cap_usd::text AS "monthlyCostCapUsd",
      COALESCE(m.msgs, 0)::int AS "monthMessages",
      COALESCE(m.cost, 0)::text AS "monthCostUsd",
      COALESCE(a.msgs, 0)::int AS "totalMessages",
      COALESCE(a.cost, 0)::text AS "totalCostUsd",
      a.last_used AS "lastUsedAt"
    FROM users u
    LEFT JOIN whatsapp_links w ON w.user_id = u.id
    LEFT JOIN ai_settings   s ON s.user_id = u.id
    LEFT JOIN (
      SELECT user_id, count(*) AS msgs, sum(cost_usd) AS cost
      FROM ai_usage WHERE created_at >= ${since} GROUP BY user_id
    ) m ON m.user_id = u.id
    LEFT JOIN (
      SELECT user_id, count(*) AS msgs, sum(cost_usd) AS cost, max(created_at) AS last_used
      FROM ai_usage GROUP BY user_id
    ) a ON a.user_id = u.id
    WHERE u.name ILIKE ${search} OR u.email ILIKE ${search}
    ORDER BY "monthCostUsd"::numeric DESC, u.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  res.json({
    defaults: { monthlyMessageCap: DEFAULT_MESSAGE_CAP, monthlyCostCapUsd: DEFAULT_COST_CAP_USD },
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      waConnected: r.waConnected,
      // null = usa o padrão do sistema
      enabled: r.enabled,
      monthlyMessageCap: r.monthlyMessageCap,
      monthlyCostCapUsd: r.monthlyCostCapUsd === null ? null : Number(r.monthlyCostCapUsd),
      monthMessages: r.monthMessages,
      monthCostUsd: Number(r.monthCostUsd ?? 0),
      totalMessages: r.totalMessages,
      totalCostUsd: Number(r.totalCostUsd ?? 0),
      lastUsedAt: r.lastUsedAt ? new Date(r.lastUsedAt).toISOString() : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

// Liga/desliga o agente e define os tetos de um cliente. Campo ausente = não mexe;
// campo null = volta a usar o padrão do sistema.
adminRouter.put('/ai/:userId', requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  const { enabled, monthlyMessageCap, monthlyCostCapUsd } = req.body ?? {};

  const data: Prisma.AiSettingsUncheckedUpdateInput = {};
  if (typeof enabled === 'boolean') data.enabled = enabled;
  if (monthlyMessageCap === null || typeof monthlyMessageCap === 'number') {
    data.monthlyMessageCap = monthlyMessageCap === null ? null : Math.max(0, Math.trunc(monthlyMessageCap));
  }
  if (monthlyCostCapUsd === null || typeof monthlyCostCapUsd === 'number') {
    data.monthlyCostCapUsd =
      monthlyCostCapUsd === null ? null : new Prisma.Decimal(Math.max(0, monthlyCostCapUsd).toFixed(2));
  }

  const saved = await prisma.aiSettings.upsert({
    where: { userId },
    create: {
      userId,
      enabled: typeof data.enabled === 'boolean' ? data.enabled : true,
      monthlyMessageCap: (data.monthlyMessageCap as number | null | undefined) ?? null,
      monthlyCostCapUsd: (data.monthlyCostCapUsd as Prisma.Decimal | null | undefined) ?? null,
    },
    update: data,
  });

  res.json({
    id: userId,
    enabled: saved.enabled,
    monthlyMessageCap: saved.monthlyMessageCap,
    monthlyCostCapUsd: saved.monthlyCostCapUsd === null ? null : Number(saved.monthlyCostCapUsd),
  });
});
