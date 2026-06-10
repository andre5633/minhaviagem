import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'ghost' | 'danger' | 'google';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold whitespace-nowrap leading-none transition active:scale-[.97] disabled:opacity-60 disabled:pointer-events-none select-none';

const sizes: Record<Size, string> = {
  md: 'h-11 px-[18px] text-[14.5px]',
  lg: 'h-[52px] px-[22px] text-[15.5px]',
};

const variants: Record<Variant, string> = {
  primary:
    'text-white shadow-[0_8px_20px_-6px_var(--mv-primary)] bg-[linear-gradient(135deg,var(--mv-primary),var(--mv-primary-d))]',
  ghost: 'bg-surface text-ink-3 border-[1.5px] border-line-2 hover:bg-surface-2',
  danger: 'bg-bad-l text-bad border-[1.5px] border-bad-bd hover:bg-bad-l2',
  google: 'bg-white text-[#3C4043] border-[1.5px] border-line-2 shadow-[0_4px_14px_-6px_rgba(0,0,0,.28)] hover:bg-[#F3F4F6]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, sizes[size], variants[variant], block && 'w-full', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Spinner size={size === 'lg' ? 20 : 16} color="currentColor" />
      ) : (
        <>
          {leftIcon}
          {children && <span>{children}</span>}
          {rightIcon}
        </>
      )}
    </button>
  );
}
