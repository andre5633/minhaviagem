import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, X, Plus, Calendar } from 'lucide-react';
import { useTrip } from '../hooks/useTrips';
import { useExpenses } from '../hooks/useExpenses';
import { useApp } from '../store/AppContext';
import { TripHeader } from '../components/domain/TripHeader';
import { ExpenseItem } from '../components/domain/ExpenseItem';
import { CategoryChip } from '../components/domain/CategoryChip';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { NoteIllustration } from '../components/ui/illustrations/NoteIllustration';
import { Button } from '../components/ui/Button';
import { FAB } from '../components/layout/FAB';
import { formatDayHeader, formatBRLShort } from '../lib/formatters';
import type { Expense } from '../types';

interface DayGroup {
  date: string;
  items: Expense[];
  total: number;
}

export function ExpenseList() {
  const { id } = useParams();
  const { trip, summary } = useTrip(id);
  const { expenses, deleteExpense } = useExpenses(id);
  const { openExpenseSheet, toast, categories } = useApp();

  const [filter, setFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDates, setShowDates] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const usedCats = useMemo(
    () => categories.filter((c) => expenses.some((e) => e.category === c.key)),
    [expenses, categories],
  );
  const q = query.trim().toLowerCase();
  const anyFilter = Boolean(filter || q || dateFrom || dateTo);

  const filtered = useMemo(() => {
    let list = expenses;
    if (filter) list = list.filter((e) => e.category === filter);
    if (q) list = list.filter((e) => e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    if (dateFrom) list = list.filter((e) => e.expenseDate >= dateFrom);
    if (dateTo) list = list.filter((e) => e.expenseDate <= dateTo);
    return [...list].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate) || b.id.localeCompare(a.id));
  }, [expenses, filter, q, dateFrom, dateTo]);

  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  const groups = useMemo(() => {
    const out: DayGroup[] = [];
    filtered.forEach((e) => {
      let g = out.find((x) => x.date === e.expenseDate);
      if (!g) {
        g = { date: e.expenseDate, items: [], total: 0 };
        out.push(g);
      }
      g.items.push(e);
      g.total += e.amount;
    });
    return out;
  }, [filtered]);

  const clearFilters = () => {
    setFilter(null);
    setQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const remove = (e: Expense) => {
    deleteExpense(e.id);
    toast('Despesa removida', 'delete');
  };

  if (!trip || !summary) return null;

  return (
    <div className="mx-auto max-w-[1080px] px-5 pb-28 pt-0 lg:px-10 lg:pb-12 lg:pt-8">
      <TripHeader trip={trip} summary={summary} current="expenses" />

      <div className="pt-4 lg:pt-6">
        {!loading && expenses.length > 0 && (
          <div className="mb-4 flex flex-col gap-3">
            {/* busca + datas */}
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <div className="flex h-11 flex-1 items-center gap-2 rounded-2xl border-[1.5px] border-line-2 bg-surface pl-3.5 pr-2 focus-within:border-primary">
                <Search size={18} className="text-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por descrição ou categoria…"
                  className="min-w-0 flex-1 bg-transparent text-[14.5px] font-medium text-ink outline-none placeholder:text-faint-2"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="flex h-7 w-7 items-center justify-center rounded-lg bg-subtle text-faint">
                    <X size={15} />
                  </button>
                )}
                <button
                  onClick={() => setShowDates((s) => !s)}
                  aria-label="Filtrar por data"
                  className={
                    'flex h-8 w-8 items-center justify-center rounded-lg transition lg:hidden ' +
                    (dateFrom || dateTo ? 'bg-primary text-white' : 'bg-subtle text-ink-3')
                  }
                >
                  <Calendar size={17} />
                </button>
              </div>
              {/* datas inline no desktop */}
              <div className="hidden gap-2.5 lg:flex">
                <DateField label="De" value={dateFrom} onChange={setDateFrom} />
                <DateField label="Até" value={dateTo} min={dateFrom} onChange={setDateTo} />
                {anyFilter && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex h-11 items-center gap-1.5 rounded-2xl border-[1.5px] border-line-2 bg-surface px-3.5 text-[13.5px] font-bold text-muted transition hover:border-bad-bd hover:bg-bad-l hover:text-bad"
                  >
                    <X size={15} />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* datas mobile (expansível) */}
            {showDates && (
              <div className="flex gap-2.5 lg:hidden">
                <DateField label="De" value={dateFrom} onChange={setDateFrom} grow />
                <DateField label="Até" value={dateTo} min={dateFrom} onChange={setDateTo} grow />
              </div>
            )}

            {/* chips de categoria */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilter(null)}
                className={
                  'inline-flex h-[34px] items-center gap-1 rounded-full border-[1.5px] px-3 text-[12.5px] font-bold transition ' +
                  (!filter ? 'border-primary bg-primary text-white' : 'border-line-2 bg-surface text-ink-3')
                }
              >
                Todas <span className="opacity-60">{expenses.length}</span>
              </button>
              {usedCats.map((c) => (
                <CategoryChip
                  key={c.key}
                  category={c.key}
                  size="sm"
                  selected={filter === c.key}
                  onClick={() => setFilter((f) => (f === c.key ? null : c.key))}
                />
              ))}
              {anyFilter && (
                <span className="ml-auto text-[12.5px] font-semibold text-faint">
                  {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'} · {formatBRLShort(filteredTotal)}
                </span>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Card key={i} className="flex items-center gap-3 p-3.5">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="mt-2 h-2.5 w-1/4" />
                </div>
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={Search}
            title={anyFilter ? 'Nenhuma despesa encontrada' : 'Nenhuma despesa ainda'}
            body={anyFilter ? 'Ajuste a busca, o período ou a categoria.' : 'Lance sua primeira despesa para acompanhar os gastos da viagem.'}
            illustration={anyFilter ? undefined : <NoteIllustration />}
            action={
              anyFilter ? (
                <Button variant="ghost" size="lg" leftIcon={<X size={20} />} onClick={clearFilters}>
                  Limpar filtros
                </Button>
              ) : (
                <Button variant="primary" size="lg" leftIcon={<Plus size={20} />} onClick={() => openExpenseSheet({ mode: 'add', tripId: trip.id })}>
                  Lançar despesa
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* MOBILE: cards agrupados */}
            <div className="flex flex-col gap-5 lg:hidden">
              {groups.map((g) => (
                <div key={g.date}>
                  <div className="mb-2 flex items-center justify-between px-0.5 text-[12.5px] font-extrabold capitalize text-muted">
                    <span>{formatDayHeader(g.date)}</span>
                    <span className="text-faint-2">{formatBRLShort(g.total)}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {g.items.map((e) => (
                      <ExpenseItem
                        key={e.id}
                        expense={e}
                        variant="card"
                        onEdit={() => openExpenseSheet({ mode: 'edit', tripId: trip.id, expense: e })}
                        onDelete={() => remove(e)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP: tabela agrupada */}
            <Card className="hidden overflow-hidden p-0 lg:block">
              {groups.map((g) => (
                <div key={g.date}>
                  <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-2.5 text-[12.5px] font-extrabold capitalize text-muted">
                    <span>{formatDayHeader(g.date)}</span>
                    <span className="text-faint">{formatBRLShort(g.total)}</span>
                  </div>
                  {g.items.map((e) => (
                    <ExpenseItem
                      key={e.id}
                      expense={e}
                      variant="row"
                      onEdit={() => openExpenseSheet({ mode: 'edit', tripId: trip.id, expense: e })}
                      onDelete={() => remove(e)}
                    />
                  ))}
                </div>
              ))}
            </Card>
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

function DateField({
  label,
  value,
  min,
  onChange,
  grow,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (v: string) => void;
  grow?: boolean;
}) {
  return (
    <div
      className={
        'flex h-11 items-center gap-2 rounded-2xl border-[1.5px] border-line-2 bg-surface px-3 focus-within:border-primary ' +
        (grow ? 'flex-1' : '')
      }
    >
      <label className="text-xs font-bold text-faint">{label}</label>
      <input
        type="date"
        value={value}
        min={min || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] font-semibold text-ink outline-none"
      />
    </div>
  );
}
