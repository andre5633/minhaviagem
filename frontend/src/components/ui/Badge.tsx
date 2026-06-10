import type { ReactNode } from 'react';
import { hexA } from '../../lib/cn';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  soft?: boolean;
}

export function Badge({ children, color = '#EF5244', soft = true }: BadgeProps) {
  const style = soft
    ? { background: hexA(color, 0.14), color }
    : { background: color, color: '#fff' };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[11.5px] font-bold"
      style={style}
    >
      {children}
    </span>
  );
}
