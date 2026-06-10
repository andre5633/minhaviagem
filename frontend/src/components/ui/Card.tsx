import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface shadow-card',
        interactive && 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-cardHover active:translate-y-0 active:scale-[.99]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
