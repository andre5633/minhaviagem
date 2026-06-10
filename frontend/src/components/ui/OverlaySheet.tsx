import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface OverlaySheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Overlay responsivo:
 * - mobile: bottom sheet que desliza de baixo
 * - desktop (lg+): modal centralizado
 */
export function OverlaySheet({ open, onClose, title, children }: OverlaySheetProps) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else if (mounted) {
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 z-[80] flex items-end justify-center lg:items-center lg:p-10">
      {/* scrim */}
      <div
        className={open ? 'mv-anim-scrim absolute inset-0 bg-black/40' : 'absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300'}
        onClick={onClose}
      />
      {/* painel */}
      <div
        className={
          (open ? 'mv-overlay-panel ' : 'translate-y-full opacity-0 transition-all duration-300 lg:translate-y-2 ') +
          'relative flex max-h-[88%] w-full flex-col rounded-t-[26px] bg-surface px-[22px] pb-8 pt-2 shadow-[0_-14px_40px_-10px_rgba(0,0,0,.35)] lg:max-h-[90%] lg:w-[520px] lg:rounded-[22px] lg:px-7 lg:pb-7 lg:pt-5 lg:shadow-[0_30px_70px_-20px_rgba(0,0,0,.5)]'
        }
      >
        {/* grab handle (mobile) */}
        <div className="mx-auto mb-1 mt-1.5 h-[5px] w-10 cursor-pointer rounded-full bg-line-2 lg:hidden" onClick={onClose} />
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-[19px] font-extrabold tracking-tight text-ink lg:text-xl">{title}</h2>}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-ink-3 transition hover:bg-subtle active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mv-scroll overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
