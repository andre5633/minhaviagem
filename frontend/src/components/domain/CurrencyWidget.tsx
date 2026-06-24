import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { api } from '../../lib/api';
import type { CurrencyRate } from '../../types';

const FLAG: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  CHF: '🇨🇭',
};

function fmtRate(r: number) {
  return r.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: r < 1 ? 4 : 2 });
}

export function CurrencyWidget() {
  const [rates, setRates] = useState<CurrencyRate[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .getRates()
      .then((d) => active && setRates(d))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="p-[18px] lg:p-[22px]">
      <div className="mb-3 flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-ink-2">
        <span aria-hidden>💱</span>
        Cotação do dia
        <span className="font-semibold text-faint">· Real (R$)</span>
      </div>

      {error ? (
        <div className="py-10 text-center text-sm text-faint">Cotações indisponíveis no momento.</div>
      ) : !rates ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {rates.map((r) => {
            const pct = r.pctChange != null && r.pctChange !== '' ? Number(r.pctChange) : null;
            const up = pct != null && pct >= 0;
            return (
              <div key={r.code} className="flex items-center gap-3 border-b border-subtle py-2.5 last:border-b-0">
                <span className="text-xl leading-none">{FLAG[r.code] ?? '🏳️'}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold text-ink">{r.code}</div>
                  <div className="truncate text-[11.5px] text-faint">{r.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-extrabold text-ink">R$ {fmtRate(r.rate)}</div>
                  {pct != null && (
                    <div
                      className="flex items-center justify-end gap-0.5 text-[11.5px] font-bold"
                      style={{ color: up ? 'var(--mv-ok)' : 'var(--mv-bad)' }}
                    >
                      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {Math.abs(pct).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {rates[0]?.fetchedAt && (
            <div className="mt-2.5 text-right text-[10.5px] text-faint-2">
              atualizado{' '}
              {new Date(rates[0].fetchedAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
