import { useState } from 'react';
import { Wallet, Info, LogOut, User as UserIcon, ListChecks, Tags } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { GoogleIcon } from '../components/ui/GoogleIcon';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { GlobalChecklistEditor } from '../components/domain/GlobalChecklistEditor';
import { CategoryEditor } from '../components/domain/CategoryEditor';
import { cn } from '../lib/cn';

type Tab = 'perfil' | 'checklist' | 'categorias';

export function Profile() {
  const { user, logout } = useApp();
  const [tab, setTab] = useState<Tab>('perfil');

  return (
    <div
      className={cn(
        'mx-auto px-5 pb-28 pt-12 lg:px-10 lg:pb-12 lg:pt-8',
        tab === 'perfil' ? 'max-w-[680px]' : 'max-w-[1080px]',
      )}
    >
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink lg:text-[27px]">Perfil</h1>
        <ThemeToggle variant="inline" className="lg:hidden" />
      </header>

      {/* Abas */}
      <div className="mb-5 flex items-center gap-1 border-b border-line">
        <TabBtn active={tab === 'perfil'} Icon={UserIcon} label="Perfil" onClick={() => setTab('perfil')} />
        <TabBtn active={tab === 'checklist'} Icon={ListChecks} label="Meu Checklist" onClick={() => setTab('checklist')} />
        <TabBtn active={tab === 'categorias'} Icon={Tags} label="Minhas Categorias" onClick={() => setTab('categorias')} />
      </div>

      {tab === 'perfil' ? (
        <>
          <Card className="mb-[18px] flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left lg:p-7">
            <Avatar name={user.name} size={84} src={user.avatarUrl} />
            <div className="flex-1">
              <h2 className="text-[21px] font-extrabold tracking-tight text-ink">{user.name}</h2>
              <div className="mt-0.5 text-sm text-faint">{user.email}</div>
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-subtle px-3 py-[5px] text-xs font-semibold text-muted">
                <GoogleIcon size={14} />
                Conectado com Google
              </div>
            </div>
            <Button variant="danger" size="lg" leftIcon={<LogOut size={20} />} onClick={logout} className="hidden sm:inline-flex">
              Sair da conta
            </Button>
          </Card>

          <div className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-ink-2">
            <UserIcon size={16} className="text-faint" />
            Conta
          </div>
          <Card className="mb-[18px] p-1.5">
            {(
              [
                { Icon: Wallet, label: 'Moeda padrão', detail: 'BRL (R$)' },
                { Icon: Info, label: 'Sobre o app', detail: 'v1.0.0' },
              ] as const
            ).map((r, i, arr) => (
              <div
                key={r.label}
                className={'flex items-center gap-3 px-3 py-3.5 ' + (i < arr.length - 1 ? 'border-b border-subtle' : '')}
              >
                <r.Icon size={19} className="text-faint" />
                <span className="flex-1 text-[14.5px] font-semibold text-ink-2">{r.label}</span>
                <span className="text-sm text-faint">{r.detail}</span>
              </div>
            ))}
          </Card>

          <Button variant="danger" size="lg" block leftIcon={<LogOut size={20} />} onClick={logout} className="sm:hidden">
            Sair da conta
          </Button>
          <p className="mt-[18px] text-center text-[11.5px] text-faint-2">
            Minha Viagem Organizada · feito para a estrada
          </p>
        </>
      ) : tab === 'checklist' ? (
        <GlobalChecklistEditor />
      ) : (
        <CategoryEditor />
      )}
    </div>
  );
}

function TabBtn({
  active,
  Icon,
  label,
  onClick,
}: {
  active: boolean;
  Icon: typeof UserIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        '-mb-px inline-flex items-center gap-1.5 border-b-[2.5px] px-3.5 pb-3 pt-1.5 text-[14.5px] font-bold transition',
        active ? 'border-primary text-primary-dark' : 'border-transparent text-faint hover:text-ink-3',
      )}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}
