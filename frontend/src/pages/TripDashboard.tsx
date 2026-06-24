import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Coins, Wallet, Clock, Compass, Plus } from 'lucide-react';
import { useTrip } from '../hooks/useTrips';
import { useApp } from '../store/AppContext';
import { TripHeader } from '../components/domain/TripHeader';
import { MetricCard } from '../components/domain/MetricCard';
import { BudgetProgress } from '../components/domain/BudgetProgress';
import { CategoryDonut } from '../components/charts/CategoryDonut';
import { CurrencyWidget } from '../components/domain/CurrencyWidget';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { FAB } from '../components/layout/FAB';
import { formatBRL, formatBRLShort } from '../lib/formatters';

export function TripDashboard() {
  const { id } = useParams();
  const { trip, summary } = useTrip(id);
  const { openExpenseSheet, categoryMap } = useApp();
  const [loading, setLoading] = useState(true);
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, [id]);

  if (!trip || !summary) return null;
  const s = summary;
  const negative = s.balance < 0;

  return (
    <div className="mx-auto max-w-[1080px] px-5 pb-28 pt-0 lg:px-10 lg:pb-12 lg:pt-8">
      <TripHeader trip={trip} summary={s} current="dashboard" />

      <div className="pt-4 lg:pt-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-24 rounded-card" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-card" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Skeleton className="h-72 rounded-card" />
              <Skeleton className="h-72 rounded-card" />
            </div>
          </div>
        ) : (
          <>
            <Card className="mb-3.5 p-4 lg:p-5">
              <BudgetProgress spent={s.totalSpent} budget={s.totalBudget} height={10} showLabels />
            </Card>

            <div className="mb-3 lg:hidden">
              <MetricCard
                hero
                negative={negative}
                label="Saldo restante"
                value={formatBRL(s.balance)}
                Icon={Wallet}
                sub={negative ? `Você passou ${formatBRLShort(Math.abs(s.balance))} do orçamento` : `de ${formatBRLShort(s.totalBudget)} planejados`}
              />
            </div>

            {/* métricas: 2 col mobile, 4 col desktop (saldo como 1ª no desktop) */}
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
              <div className="hidden lg:block">
                <MetricCard
                  hero
                  negative={negative}
                  label="Saldo restante"
                  value={formatBRLShort(s.balance)}
                  Icon={Wallet}
                  sub={negative ? `${formatBRLShort(Math.abs(s.balance))} acima` : 'dentro do orçamento'}
                />
              </div>
              <MetricCard label="Orçamento total" value={formatBRLShort(s.totalBudget)} Icon={Coins} tone="#43346A" />
              <MetricCard label="Gasto total" value={formatBRLShort(s.totalSpent)} Icon={Wallet} tone="#EF5244" />
              <MetricCard
                label={s.status === 'upcoming' ? 'Dias p/ começar' : 'Dias restantes'}
                value={s.status === 'past' ? '—' : s.daysRemaining}
                Icon={Clock}
                tone="#2E9E8F"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* categorias */}
              <Card className="p-[18px] lg:p-[22px]">
                <div className="mb-4 flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-ink-2">
                  <Compass size={17} className="text-primary" />
                  Gastos por categoria
                </div>
                {s.spendingByCategory.length === 0 ? (
                  <div className="py-10 text-center text-sm text-faint">Nenhuma despesa lançada ainda.</div>
                ) : (
                  <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
                    <CategoryDonut
                      data={s.spendingByCategory}
                      total={s.totalSpent}
                      size={176}
                      active={activeSlice}
                      onSlice={(c) => setActiveSlice((a) => (a === c ? null : c))}
                    />
                    <div className="flex w-full flex-1 flex-col gap-2.5">
                      {s.spendingByCategory.map((c) => {
                        const pct = Math.round((c.amount / s.totalSpent) * 100);
                        const dim = activeSlice && activeSlice !== c.category;
                        const Icon = categoryMap[c.category]?.Icon ?? Compass;
                        return (
                          <button
                            key={c.category}
                            onClick={() => setActiveSlice((a) => (a === c.category ? null : c.category))}
                            className="flex items-center gap-2.5 transition"
                            style={{ opacity: dim ? 0.4 : 1 }}
                          >
                            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px]" style={{ background: c.color }} />
                            <Icon size={15} color={c.color} className="flex-shrink-0" />
                            <span className="flex-1 truncate text-left text-[13px] font-semibold text-ink-2">{c.name}</span>
                            <span className="text-[13px] font-bold text-ink">{formatBRLShort(c.amount)}</span>
                            <span className="w-9 text-right text-xs font-bold text-faint">{pct}%</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              {/* cotação de moedas */}
              <CurrencyWidget />
            </div>
          </>
        )}
      </div>

      <FAB
        className="bottom-24 right-5 lg:hidden"
        extended
        onClick={() => openExpenseSheet({ mode: 'add', tripId: trip.id })}
        icon={<Plus size={22} />}
        label="Lançar despesa"
      />
    </div>
  );
}
