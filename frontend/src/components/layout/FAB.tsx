import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface FABProps {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
  /** com rótulo estendido */
  extended?: boolean;
  className?: string;
}

/** Botão flutuante (mobile). No desktop normalmente fica oculto via className. */
export function FAB({ onClick, icon, label, extended, className }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        'mv-anim-fab absolute z-30 flex items-center justify-center bg-[linear-gradient(135deg,var(--mv-primary),var(--mv-primary-d))] text-white shadow-fab transition hover:-translate-y-0.5 active:scale-95',
        extended ? 'h-[54px] gap-2 rounded-2xl pl-[17px] pr-5 text-[15px] font-bold' : 'h-[60px] w-[60px] rounded-[20px]',
        className,
      )}
    >
      {icon}
      {extended && label && <span>{label}</span>}
    </button>
  );
}
