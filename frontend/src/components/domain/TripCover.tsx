import type { ReactNode } from 'react';
import { COVERS } from '../../lib/categories';
import type { CoverKey } from '../../types';

interface TripCoverProps {
  cover: CoverKey;
  image?: string | null;
  height?: number;
  className?: string;
  children?: ReactNode;
  showTag?: boolean;
}

export function TripCover({ cover, image, height = 132, className, children, showTag = true }: TripCoverProps) {
  const def = COVERS[cover] ?? COVERS.beach;
  const Icon = def.Icon;
  const bgImage = image ?? def.image;
  return (
    <div
      className={'relative overflow-hidden ' + (className ?? '')}
      style={{ height, background: def.gradient }}
    >
      <img src={bgImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {children}
    </div>
  );
}
