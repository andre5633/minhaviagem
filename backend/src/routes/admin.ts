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
    SELECT u.id, u.name, u.email, u.created_at AS "createdAt", u.last_login_at AS "lastLoginAt",
      GREATEST(
        COALESCE((SELECT max(t.created_at) FROM trips t WHERE t.user_id = u.id), to_timestamp(0)),
        COALESCE((SELECT max(e.created_at) FROM expenses e JOIN trips t ON t.id = e.trip_id WHERE t.user_id = u.id), to_timestamp(0))
      ) AS "lastCreate"
    FROM users u
    WHERE u.name ILIKE ${search} OR u.email ILIKE ${search}
    ORDER BY ${Prisma.raw(sortCol)} ${Prisma.raw(dir)} NULLS LAST
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const data = rows.map((r) => {
    const lastCreate = r.lastCreate ? new Date(r.lastCreate) : null;
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : null,
      lastCreate: lastCreate && lastCreate.getTime() > 0 ? lastCreate.toISOString() : null,
    };
  });

  res.json({ data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
});
