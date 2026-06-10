import { Moon, Sun } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { cn } from '../../lib/cn';

interface ThemeToggleProps {
  /** 'floating' (canto) ou 'inline' (dentro de barra) */
  variant?: 'floating' | 'inline';
  className?: string;
}

export function ThemeToggle({ variant = 'floating', className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      className={cn(
        'inline-flex h-10 items-center gap-1.5 rounded-full border border-line-2 bg-surface px-[15px] pl-3 text-[13px] font-bold text-ink transition hover:-translate-y-px active:scale-95',
        variant === 'floating' && 'shadow-[0_8px_22px_-10px_rgba(0,0,0,.5)]',
        className,
      )}
    >
      {isDark ? <Sun size={20} className="text-primary" /> : <Moon size={20} className="text-primary" />}
      <span>{isDark ? 'Claro' : 'Escuro'}</span>
    </button>
  );
}
