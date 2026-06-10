import type { CSSProperties } from 'react';
import { cn } from '../../lib/cn';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={cn('mv-anim-shimmer rounded-lg', className)} style={style} />;
}
