import { Router } from 'express';
import type { CurrencyRate } from '@prisma/client';
import { prisma } from '../lib/prisma';

const TTL_MS = 60 * 60 * 1000; // 1 hora
const TOKEN = process.env.AWESOMEAPI_TOKEN;

// 5 principais moedas do mundo, cotadas em BRL
const CURRENCIES = [
  { code: 'USD', name: 'Dólar americano' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Libra esterlina' },
  { code: 'JPY', name: 'Iene japonês' },
  { code: 'CHF', name: 'Franco suíço' },
];

interface FetchedRate {
  code: string;
  name: string;
  rate: number;
  pctChange: string | null;
}

// Principal: AwesomeAPI (BRL nativo + variação %), usa token se houver
async function fetchAwesome(): Promise<FetchedRate[]> {
  const pairs = CURRENCIES.map((c) => `${c.code}-BRL`).join(',');
  const url = `https://economia.awesomeapi.com.br/json/last/${pairs}${TOKEN ? `?token=${TOKEN}` : ''}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`awesomeapi ${res.status}`);
  const data = (await res.json()) as Record<string, { bid: string; pctChange: string }>;
  return CURRENCIES.map((c) => {
    const d = data[`${c.code}BRL`];
    if (!d?.bid) throw new Error('awesomeapi payload');
    return { code: c.code, name: c.name, rate: Number(d.bid), pctChange: d.pctChange ?? null };
  });
}

// Fallback: exchangerate-api free (sem chave). Base BRL → inverte para R$/unidade.
async function fetchOpen(): Promise<FetchedRate[]> {
  const res = await fetch('https://open.er-api.com/v6/latest/BRL', { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`open.er-api ${res.status}`);
  const data = (await res.json()) as { result: string; rates: Record<string, number> };
  if (data.result !== 'success' || !data.rates) throw new Error('open.er-api payload');
  return CURRENCIES.map((c) => ({
    code: c.code,
    name: c.name,
    rate: 1 / data.rates[c.code],
    pctChange: null,
  }));
}

async function fetchRates(): Promise<FetchedRate[]> {
  try {
    return await fetchAwesome();
  } catch {
    return await fetchOpen();
  }
}

function serialize(rows: CurrencyRate[]) {
  const order = new Map(CURRENCIES.map((c, i) => [c.code, i]));
  return [...rows]
    .sort((a, b) => (order.get(a.code) ?? 99) - (order.get(b.code) ?? 99))
    .map((r) => ({
      code: r.code,
      name: r.name,
      rate: Number(r.rate),
      pctChange: r.pctChange,
      fetchedAt: r.fetchedAt.toISOString(),
    }));
}

export const ratesRouter = Router();

// Público — dado genérico, cacheado no servidor
ratesRouter.get('/', async (_req, res) => {
  const cached = await prisma.currencyRate.findMany();
  const fresh =
    cached.length >= CURRENCIES.length &&
    cached.every((r) => Date.now() - r.fetchedAt.getTime() < TTL_MS);
  if (fresh) {
    res.json(serialize(cached));
    return;
  }
  try {
    const rates = await fetchRates();
    const now = new Date();
    for (const r of rates) {
      await prisma.currencyRate.upsert({
        where: { code: r.code },
        update: { name: r.name, rate: r.rate, pctChange: r.pctChange, fetchedAt: now },
        create: { code: r.code, name: r.name, rate: r.rate, pctChange: r.pctChange, fetchedAt: now },
      });
    }
    res.json(serialize(await prisma.currencyRate.findMany()));
  } catch {
    // API fora do ar → serve a última cotação salva, se houver
    if (cached.length) {
      res.json(serialize(cached));
      return;
    }
    res.status(503).json({ error: 'Cotações indisponíveis no momento' });
  }
});
