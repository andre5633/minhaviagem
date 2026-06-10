import 'express-async-errors';
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { authRouter } from './routes/auth';
import { tripsRouter } from './routes/trips';
import { expensesRouter } from './routes/expenses';
import './lib/passport'; // registra a estratégia Google

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' })); // 10 mb para suportar coverImage em base64
app.use(cookieParser());
app.use(passport.initialize());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/trips', tripsRouter);
app.use('/expenses', expensesRouter);

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
