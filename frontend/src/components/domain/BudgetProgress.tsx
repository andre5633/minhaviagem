import { formatBRLShort } from '../../lib/formatters';

interface BudgetProgressProps {
  spent: number;
  budget: number;
  height?: number;
  showLabels?: boolean;
}

export function BudgetProgress({ spent, budget, height = 9, showLabels }: BudgetProgressProps) {
  const pct = budget ? (spent / budget) * 100 : 0;
  const clamped = Math.min(100, pct);
  const over = pct > 100;
  const warn = pct > 85 && !over;
  const fill = over
    ? 'linear-gradient(90deg,#fb923c,var(--mv-bad))'
    : warn
      ? 'linear-gradient(90deg,#f7b733,#f59e0b)'
      : 'linear-gradient(90deg, var(--mv-primary-d), var(--mv-primary))';

  return (
    <div className="w-full">
      {showLabels && (
        <div className="mb-1.5 flex justify-between text-[12.5px] font-semibold">
          <span className="text-muted">{formatBRLShort(spent)} gastos</span>
          <span style={{ color: over ? 'var(--mv-bad)' : 'var(--mv-faint)' }}>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="overflow-hidden rounded-full bg-line" style={{ height, borderRadius: height }}>
        <div
          className="h-full transition-[width] duration-700 ease-out"
          style={{ width: `${Math.max(over ? 100 : 2, clamped)}%`, borderRadius: height, background: fill }}
        />
      </div>
    </div>
  );
}
