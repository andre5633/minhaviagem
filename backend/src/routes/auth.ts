import { Router } from 'express';
import passport from 'passport';
import type { User } from '@prisma/client';
import { signToken } from '../lib/jwt';
import { requireAuth } from '../middleware/requireAuth';

export const authRouter = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
};

// Inicia o fluxo OAuth com o Google
authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['email', 'profile'], session: false }),
);

// Google redireciona de volta aqui com o code
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),
  (req, res) => {
    const user = req.user as User;
    const token = signToken(user.id);
    res.cookie('mv_token', token, COOKIE_OPTS);
    res.redirect(`${process.env.FRONTEND_URL}/trips`);
  },
);

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('mv_token');
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { id, name, email, avatarUrl } = req.user!;
  res.json({ id, name, email, avatarUrl });
});
