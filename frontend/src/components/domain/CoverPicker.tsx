import { useRef, type ChangeEvent } from 'react';
import { Image as ImageIcon, Pencil } from 'lucide-react';
import { COVER_KEYS } from '../../lib/categories';
import type { CoverKey } from '../../types';
import { TripCover } from './TripCover';
import { cn } from '../../lib/cn';

interface CoverPickerProps {
  value: CoverKey;
  image?: string | null;
  onChange: (next: { cover: CoverKey; coverImage: string | null }) => void;
}

export function CoverPicker({ value, image, onChange }: CoverPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ cover: value, coverImage: String(reader.result) });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex gap-2.5">
      {COVER_KEYS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange({ cover: c, coverImage: null })}
          className={cn(
            'min-w-0 flex-1 overflow-hidden rounded-2xl border-2 transition active:scale-95',
            !image && value === c ? 'border-primary' : 'border-transparent',
          )}
        >
          <TripCover cover={c} height={54} showTag={false} />
        </button>
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative min-w-0 flex-1 overflow-hidden rounded-2xl border-2 border-dashed bg-surface-2 transition active:scale-95',
          image ? 'border-primary border-solid' : 'border-line-2',
        )}
      >
        {image ? (
          <div className="relative h-[54px]">
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute bottom-1 right-1 flex h-[22px] w-[22px] items-center justify-center rounded-md bg-black/55">
              <Pencil size={13} color="#fff" />
            </span>
          </div>
        ) : (
          <div className="flex h-[54px] flex-col items-center justify-center gap-1">
            <ImageIcon size={17} className="text-primary" />
            <span className="text-[10px] font-bold text-muted">Enviar foto</span>
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
