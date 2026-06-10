import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Compass } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  illustrationTag?: string;
}

export function EmptyState({ icon: Icon = Compass, title, body, action, illustrationTag }: EmptyStateProps) {
  return (
    <div className="mx-auto mt-6 flex max-w-sm flex-col items-center px-6 py-8 text-center">
      <div
        className="relative mb-[18px] flex h-[132px] w-[132px] flex-col items-center justify-center rounded-[32px]"
        style={{
          background:
            'repeating-linear-gradient(45deg, var(--mv-primary-l), var(--mv-primary-l) 11px, transparent 11px, transparent 22px)',
        }}
      >
        <Icon size={44} className="text-primary" strokeWidth={1.8} />
        {illustrationTag && (
          <span className="absolute bottom-2.5 font-mono text-[9.5px] text-primary/70">{illustrationTag}</span>
        )}
      </div>
      <h3 className="mb-1.5 text-lg font-extrabold tracking-tight text-ink">{title}</h3>
      {body && <p className="mb-[22px] text-sm leading-relaxed text-muted">{body}</p>}
      {action}
    </div>
  );
}
