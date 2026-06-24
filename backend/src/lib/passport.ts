import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from './prisma';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn(
    '⚠️  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET não configurados — login com Google desativado.\n' +
    '   Preencha o .env e reinicie os containers.',
  );
} else {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const now = new Date();
          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              name: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value ?? null,
              lastLoginAt: now,
            },
            create: {
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails?.[0]?.value ?? '',
              avatarUrl: profile.photos?.[0]?.value ?? null,
              lastLoginAt: now,
            },
          });
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
}
