import { BarChart, Bar, Cell, XAxis, ResponsiveContainer, LabelList } from 'recharts';
import { todayISO, formatBRLShort } from '../../lib/formatters';
import type { DaySpend } from '../../types';

interface DailyBarsProps {
  data: DaySpend[];
  height?: number;
}

export function DailyBars({ data, height = 170 }: DailyBarsProps) {
  const iso = todayISO();

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 4, bottom: 0, left: 4 }} barCategoryGap="22%">
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fontSize: 10.5, fontWeight: 600, fill: 'var(--mv-faint)' }}
          />
          <Bar dataKey="amount" radius={[7, 7, 0, 0]} isAnimationActive maxBarSize={40}>
            <LabelList
              dataKey="amount"
              position="top"
              formatter={(v: unknown) => {
                const n = Number(v) || 0;
                return n > 0 ? formatBRLShort(n).replace('R$\u00A0', '') : '';
              }}
              style={{ fontSize: 9.5, fontWeight: 700, fill: 'var(--mv-faint)' }}
            />
            {data.map((d) => {
              const isToday = d.date === iso;
              const has = d.amount > 0;
              return (
                <Cell
                  key={d.date}
                  fill={has ? 'var(--mv-primary)' : 'var(--mv-border-2)'}
                  opacity={has ? (isToday ? 1 : 0.55) : 1}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
