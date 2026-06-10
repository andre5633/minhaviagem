import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies['mv_token'];
  if (!token) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }
  try {
    const { sub } = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user) {
      res.clearCookie('mv_token');
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.clearCookie('mv_token');
    res.status(401).json({ error: 'Sessão inválida' });
  }
}
