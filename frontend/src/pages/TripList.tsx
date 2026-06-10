import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTrips } from '../hooks/useTrips';
import { useApp } from '../store/AppContext';
import { TripCard } from '../components/domain/TripCard';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { FAB } from '../components/layout/FAB';

const ORDER: Record<string, number> = { active: 0, upcoming: 1, past: 2 };

export function TripList() {
  const { trips, summaries } = useTrips();
  const { user } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const sorted = [...trips].sort((a, b) => ORDER[summaries[a.id].status] - ORDER[summaries[b.id].status]);

  return (
    <div className="mx-auto max-w-[1040px] px-5 pb-28 pt-12 lg:px-10 lg:pb-12 lg:pt-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-[12.5px] font-semibold text-faint">Olá, {user.name.split(' ')[0]} 👋</div>
          <h1 className="mt-px text-2xl font-extrabold tracking-tight text-ink lg:text-[27px]">Minhas viagens</h1>
        </div>
        <Button variant="primary" size="lg" leftIcon={<Plus size={20} />} className="hidden lg:inline-flex" onClick={() => navigate('/trips/new')}>
          Nova viagem
        </Button>
        <button onClick={() => navigate('/profile')} className="rounded-full transition active:scale-95 lg:hidden">
          <Avatar name={user.name} size={40} src={user.avatarUrl} />
        </button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="overflow-hidden p-0">
              <Skeleton className="h-[108px] rounded-none" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="mt-2 h-3 w-2/5" />
                <Skeleton className="mt-4 h-2 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : trips.length === 0 ? (
        <EmptyState
          title="Nenhuma viagem ainda"
          body="Crie sua primeira viagem para começar a controlar o orçamento e os gastos."
          illustrationTag="[ ilustração: mapa ]"
          action={
            <Button variant="primary" size="lg" leftIcon={<Plus size={20} />} onClick={() => navigate('/trips/new')}>
              Criar minha primeira viagem
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {sorted.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              summary={summaries[trip.id]}
              onClick={() => navigate(`/trips/${trip.id}`)}
            />
          ))}
        </div>
      )}

      <FAB
        className="bottom-6 right-5 lg:hidden"
        onClick={() => navigate('/trips/new')}
        icon={<Plus size={26} />}
        label="Nova viagem"
      />
    </div>
  );
}
