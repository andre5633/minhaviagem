import 'express-async-errors';
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { authRouter } from './routes/auth';
import { tripsRouter } from './routes/trips';
import { expensesRouter } from './routes/expenses';
import { checklistsRouter, tasksRouter } from './routes/checklists';
import { globalChecklistsRouter, globalItemsRouter } from './routes/globalChecklists';
import { categoriesRouter } from './routes/categories';
import { ratesRouter } from './routes/rates';
import { adminRouter } from './routes/admin';
import { whatsappRouter } from './routes/whatsapp';
import { frontendUrl } from './lib/config';
import './lib/passport'; // registra a estratégia Google

const app = express();
app.set('trust proxy', true); // atrás do nginx — req.ip reflete o cliente (rate limit do admin)

app.use(helmet());
app.use(
  cors({
    origin: frontendUrl(),
    credentials: true,
  }),
);
// rawBody é necessário para validar a assinatura HMAC do webhook do WhatsApp
// (a Meta assina os bytes exatos do corpo; o JSON re-serializado não bate).
app.use(
  express.json({
    limit: '10mb', // 10 mb para suportar coverImage em base64
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  }),
);
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
// API sob /api para não colidir com as rotas de página da SPA (/trips, /trips/:id, ...)
app.use('/api/trips', tripsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/checklists', checklistsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/global-checklists', globalChecklistsRouter);
app.use('/api/global-items', globalItemsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/rates', ratesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/whatsapp', whatsappRouter);

// Erro global
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
