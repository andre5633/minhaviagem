import { Check, Info, Trash2 } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import type { Toast } from '../../types';

const ICONS = {
  success: Check,
  delete: Trash2,
  error: Info,
};
const BG: Record<Toast['type'], string> = {
  success: 'var(--mv-ok)',
  delete: 'var(--mv-bad)',
  error: '#F59E0B',
};

export function ToastStack() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-5">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className="mv-anim-toast pointer-events-auto flex max-w-full items-center gap-2.5 rounded-2xl px-4 py-[11px] text-[13.5px] font-semibold shadow-[0_12px_30px_-8px_rgba(0,0,0,.5)]"
            style={{ background: 'var(--mv-toast-bg)', color: 'var(--mv-toast-ink)' }}
          >
            <span
              className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: BG[t.type] }}
            >
              <Icon size={14} strokeWidth={2.5} />
            </span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
