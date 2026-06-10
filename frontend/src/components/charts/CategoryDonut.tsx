import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatBRLShort } from '../../lib/formatters';
import type { CategorySpend } from '../../types';

interface CategoryDonutProps {
  data: CategorySpend[];
  total: number;
  size?: number;
  active?: string | null;
  onSlice?: (category: string) => void;
}

export function CategoryDonut({ data, total, size = 184, active, onSlice }: CategoryDonutProps) {
  const inner = size * 0.32;
  const outer = size * 0.5;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={outer}
            paddingAngle={2}
            cornerRadius={6}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive
            onClick={(_, index) => onSlice?.(data[index].category)}
          >
            {data.map((d) => (
              <Cell
                key={d.category}
                fill={d.color}
                opacity={active && active !== d.category ? 0.32 : 1}
                style={{ cursor: onSlice ? 'pointer' : 'default', transition: 'opacity .2s' }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold text-faint">Total</span>
        <span className="mt-0.5 text-[25px] font-extrabold leading-tight text-ink">{formatBRLShort(total)}</span>
      </div>
    </div>
  );
}
