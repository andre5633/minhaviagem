import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Home, Receipt, ListChecks, User } from 'lucide-react';
import { cn } from '../../lib/cn';

const TABS = [
  { key: 'dashboard', label: 'Painel', Icon: Home },
  { key: 'expenses', label: 'Despesas', Icon: Receipt },
  { key: 'checklist', label: 'Checklist', Icon: ListChecks },
  { key: 'profile', label: 'Perfil', Icon: User },
] as const;

/** Barra de abas fixa (apenas mobile). */
export function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const path = location.pathname;
  const current =
    path === '/profile'
      ? 'profile'
      : path.endsWith('/checklist')
        ? 'checklist'
        : path.endsWith('/expenses')
          ? 'expenses'
          : 'dashboard';

  // Barra só faz sentido com contexto de viagem (ou no perfil).
  // Na lista de viagens (topo) fica oculta — como no protótipo.
  if (!id && path !== '/profile') return null;

  const go = (key: (typeof TABS)[number]['key']) => {
    if (key === 'profile') navigate('/profile');
    else if (key === 'expenses' && id) navigate(`/trips/${id}/expenses`);
    else if (key === 'checklist' && id) navigate(`/trips/${id}/checklist`);
    else if (id) navigate(`/trips/${id}`);
    else navigate('/trips');
  };

  return (
    <nav
      className="absolute inset-x-0 bottom-0 z-[25] flex border-t border-line px-2 pb-6 pt-2.5 backdrop-blur-xl lg:hidden"
      style={{ background: 'var(--mv-glass)' }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const on = current === key;
        return (
          <button
            key={key}
            onClick={() => go(key)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-semibold transition active:scale-90',
              on ? 'text-primary' : 'text-faint',
            )}
          >
            <Icon size={23} strokeWidth={on ? 2.4 : 2} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
