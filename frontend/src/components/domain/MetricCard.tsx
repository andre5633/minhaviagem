import type { LucideIcon } from 'lucide-react';
import { TrendingDown, Wallet } from 'lucide-react';
import { Card } from '../ui/Card';
import { hexA } from '../../lib/cn';

interface MetricCardProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  tone?: string;
  sub?: string;
  /** destaque (saldo) */
  hero?: boolean;
  negative?: boolean;
}

export function MetricCard({ label, value, Icon, tone = '#EF5244', sub, hero, negative }: MetricCardProps) {
  if (hero) {
    const HeroIcon = negative ? TrendingDown : Wallet;
    return (
      <Card
        className="border-none p-[18px]"
        style={{ background: negative ? 'var(--mv-bad-l)' : 'var(--mv-ok-l)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold" style={{ color: negative ? 'var(--mv-bad)' : 'var(--mv-ok)' }}>
            {label}
          </span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[10px]"
            style={{ background: negative ? 'var(--mv-bad-l2)' : 'var(--mv-ok-c)' }}
          >
            <HeroIcon size={17} style={{ color: negative ? 'var(--mv-bad)' : 'var(--mv-ok)' }} />
          </span>
        </div>
        <div
          className="mt-1.5 text-[32px] font-extrabold tracking-tight"
          style={{ color: negative ? 'var(--mv-bad)' : 'var(--mv-ok)' }}
        >
          {value}
        </div>
        {sub && (
          <div className="mt-0.5 text-[12.5px] opacity-85" style={{ color: negative ? 'var(--mv-bad)' : 'var(--mv-ok)' }}>
            {sub}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-[14px]">
      <span
        className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px]"
        style={{ background: hexA(tone, 0.12) }}
      >
        <Icon size={16} color={tone} />
      </span>
      <div className="mt-[11px] text-[19.5px] font-extrabold tracking-tight text-ink">{value}</div>
      <div className="mt-px text-xs font-semibold text-faint">{label}</div>
    </Card>
  );
}
