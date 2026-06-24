import { MapPin, Calendar, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { TripCover } from './TripCover';
import { BudgetProgress } from './BudgetProgress';
import { formatRange, formatBRLShort } from '../../lib/formatters';
import type { Trip, TripSummary } from '../../types';
import { cn } from '../../lib/cn';

const STATUS = {
  active: { label: 'Em andamento', color: 'var(--mv-ok)' },
  upcoming: { label: 'Em breve', color: 'var(--mv-primary)' },
  past: { label: 'Encerrada', color: 'var(--mv-faint)' },
};

interface TripCardProps {
  trip: Trip;
  summary: TripSummary;
  onClick?: () => void;
  onDelete?: () => void;
}

export function TripCard({ trip, summary, onClick, onDelete }: TripCardProps) {
  const st = STATUS[summary.status];
  const active = summary.status === 'active';

  return (
    <Card
      interactive
      onClick={onClick}
      className={cn('group/card overflow-hidden p-0', active && 'ring-2 ring-primary')}
    >
      <TripCover cover={trip.cover} image={trip.coverImage} height={108}>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Excluir viagem"
            className="absolute left-3 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#574f6e] backdrop-blur transition hover:bg-bad-l hover:text-bad active:scale-90 lg:opacity-0 lg:group-hover/card:opacity-100"
          >
            <Trash2 size={16} />
          </button>
        )}
        <span
          className="absolute right-3 top-2.5 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[11px] font-bold backdrop-blur"
          style={{ color: st.color }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: st.color }} />
          {st.label}
        </span>
      </TripCover>
      <div className="p-4">
        <h3 className="truncate text-[17px] font-extrabold tracking-tight text-ink">{trip.title}</h3>
        <div className="mt-0.5 flex items-center gap-1 text-[13px] text-muted">
          <MapPin size={13} className="text-faint" />
          {trip.destination}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-faint">
          <Calendar size={13} className="text-faint-2" />
          {formatRange(trip.startDate, trip.endDate)}
        </div>
        <div className="mt-3">
          <BudgetProgress spent={summary.totalSpent} budget={trip.totalBudget} height={8} />
          <div className="mt-2 flex justify-between">
            <span className="text-[13px] font-bold text-ink">{formatBRLShort(summary.totalSpent)}</span>
            <span className="text-[13px] text-faint">de {formatBRLShort(trip.totalBudget)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
