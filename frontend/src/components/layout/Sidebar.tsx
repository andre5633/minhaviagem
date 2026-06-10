import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Home, Receipt, User, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../../lib/cn';

interface NavItemProps {
  Icon: LucideIcon;
  label: string;
  active: boolean;
  sub?: boolean;
  onClick: () => void;
}

function NavItem({ Icon, label, active, sub, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 font-bold transition',
        sub ? 'py-[9px] text-[13.5px]' : 'py-[11px] text-[14.5px]',
        active ? 'bg-primary-soft text-primary-dark' : 'text-muted hover:bg-subtle hover:text-ink',
      )}
    >
      <Icon size={sub ? 17 : 19} strokeWidth={active ? 2.3 : 2} />
      {label}
    </button>
  );
}

/** Navegação lateral (apenas desktop lg+). */
export function Sidebar() {
  const { user, trips, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const path = location.pathname;
  const onProfile = path === '/profile';
  const onTrips = path === '/trips';
  const trip = id ? trips.find((t) => t.id === id) : undefined;

  return (
    <aside className="hidden w-[252px] flex-shrink-0 flex-col border-r border-line bg-surface p-4 pt-5 lg:flex">
      <button onClick={() => navigate('/trips')} className="mb-5 px-2">
        <div className="mv-brandlogo h-[62px] w-[182px]" role="img" aria-label="Minha Viagem Organizada" />
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        <NavItem Icon={Home} label="Minhas viagens" active={onTrips} onClick={() => navigate('/trips')} />
        {trip && (
          <div className="my-1.5 rounded-2xl bg-surface-2 p-2 pt-2.5">
            <div className="flex items-center gap-1.5 px-1 pb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-faint">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="truncate">{trip.title}</span>
            </div>
            <NavItem Icon={Home} label="Painel" sub active={path === `/trips/${id}`} onClick={() => navigate(`/trips/${id}`)} />
            <NavItem
              Icon={Receipt}
              label="Despesas"
              sub
              active={path === `/trips/${id}/expenses`}
              onClick={() => navigate(`/trips/${id}/expenses`)}
            />
          </div>
        )}
        <NavItem Icon={User} label="Perfil" active={onProfile} onClick={() => navigate('/profile')} />
      </nav>

      <div className="border-t border-line pt-3">
        <ThemeToggle variant="inline" className="mb-2 w-full justify-center" />
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate('/profile')} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-subtle">
            <Avatar name={user.name} size={36} src={user.avatarUrl} />
            <div className="min-w-0 text-left">
              <div className="truncate text-[13px] font-bold text-ink">{user.name}</div>
              <div className="truncate text-[11px] text-faint">{user.email}</div>
            </div>
          </button>
          <button
            onClick={logout}
            aria-label="Sair"
            title="Sair"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-subtle text-faint transition hover:bg-bad-l hover:text-bad"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
