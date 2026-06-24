import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, MapPin, Calendar, Home, Receipt, ListChecks, Pencil, Plus } from 'lucide-react';
import { TripCover } from './TripCover';
import { Button } from '../ui/Button';
import { formatRange } from '../../lib/formatters';
import type { Trip, TripSummary } from '../../types';
import { useApp } from '../../store/AppContext';
import { cn } from '../../lib/cn';

const STATUS = {
  active: { label: 'Em andamento', color: 'var(--mv-ok)' },
  upcoming: { label: 'Em breve', color: 'var(--mv-primary)' },
  past: { label: 'Encerrada', color: 'var(--mv-faint)' },
};

interface TripHeaderProps {
  trip: Trip;
  summary: TripSummary;
  current: 'dashboard' | 'expenses' | 'checklist';
}

export function TripHeader({ trip, summary, current }: TripHeaderProps) {
  const navigate = useNavigate();
  const { openExpenseSheet } = useApp();
  const st = STATUS[summary.status];

  return (
    <div>
      {/* MOBILE: barra compacta */}
      <header
        className="flex items-center gap-2 border-b border-line px-3 pb-3 pt-12 backdrop-blur lg:hidden"
        style={{ background: 'var(--mv-glass)' }}
      >
        <button
          onClick={() => navigate('/trips')}
          aria-label="Voltar"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-3 transition hover:bg-subtle active:scale-90"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-[16.5px] font-extrabold tracking-tight text-ink">{trip.title}</h1>
          <div className="truncate text-[11.5px] text-faint">
            {trip.destination} · {formatRange(trip.startDate, trip.endDate)}
          </div>
        </div>
        <button
          onClick={() => navigate(`/trips/${trip.id}/edit`)}
          aria-label="Editar"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-3 transition hover:bg-subtle active:scale-90"
        >
          <Pencil size={20} />
        </button>
      </header>

      {/* DESKTOP: banner + abas */}
      <div className="hidden lg:block">
        <div className="relative overflow-hidden rounded-card">
          <TripCover cover={trip.cover} image={trip.coverImage} height={132} showTag={!trip.coverImage} />
          <div
            className="absolute inset-0 flex flex-col justify-end p-5"
            style={{ background: 'linear-gradient(180deg, rgba(15,23,42,.05), rgba(15,23,42,.34))' }}
          >
            <button
              onClick={() => navigate('/trips')}
              className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 py-1.5 pl-2 pr-3 text-[13px] font-bold text-[#3d3556] backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft size={16} />
              Viagens
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] font-extrabold tracking-tight text-white drop-shadow">{trip.title}</h1>
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 py-1 pl-2 pr-2.5 text-[11px] font-bold backdrop-blur"
                style={{ color: st.color }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: st.color }} />
                {st.label}
              </span>
            </div>
            <div className="mt-1.5 flex gap-4">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/90 drop-shadow">
                <MapPin size={14} color="rgba(255,255,255,.85)" />
                {trip.destination}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/90 drop-shadow">
                <Calendar size={14} color="rgba(255,255,255,.85)" />
                {formatRange(trip.startDate, trip.endDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-line pt-3.5">
          <Tab active={current === 'dashboard'} Icon={Home} label="Painel" onClick={() => navigate(`/trips/${trip.id}`)} />
          <Tab
            active={current === 'expenses'}
            Icon={Receipt}
            label="Despesas"
            onClick={() => navigate(`/trips/${trip.id}/expenses`)}
          />
          <Tab
            active={current === 'checklist'}
            Icon={ListChecks}
            label="Checklist"
            onClick={() => navigate(`/trips/${trip.id}/checklist`)}
          />
          <div className="flex-1" />
          <Button variant="ghost" size="md" leftIcon={<Pencil size={18} />} onClick={() => navigate(`/trips/${trip.id}/edit`)}>
            Editar
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={18} />}
            className="ml-2"
            onClick={() => openExpenseSheet({ mode: 'add', tripId: trip.id })}
          >
            Lançar despesa
          </Button>
        </div>
      </div>
    </div>
  );
}

function Tab({
  active,
  Icon,
  label,
  onClick,
}: {
  active: boolean;
  Icon: typeof Home;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        '-mb-px inline-flex items-center gap-1.5 border-b-[2.5px] px-3.5 pb-3.5 pt-2.5 text-[14.5px] font-bold transition',
        active ? 'border-primary text-primary-dark' : 'border-transparent text-faint hover:text-ink-3',
      )}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}
