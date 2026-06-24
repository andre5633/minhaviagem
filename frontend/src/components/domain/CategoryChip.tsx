import { Tag } from 'lucide-react';
import { hexA } from '../../lib/cn';
import { useApp } from '../../store/AppContext';

interface CategoryChipProps {
  /** chave da categoria (Category.key) */
  category: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function CategoryChip({ category, selected, onClick, size = 'md' }: CategoryChipProps) {
  const { categoryMap } = useApp();
  const def = categoryMap[category];
  const color = def?.color ?? '#8B8598';
  const name = def?.name ?? category;
  const Icon = def?.Icon ?? Tag;
  const sm = size === 'sm';
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 rounded-full border-[1.5px] font-bold transition active:scale-95 ' +
        (sm ? 'h-[34px] px-3 text-[12.5px] ' : 'h-[38px] pl-[11px] pr-3.5 text-[13px] ')
      }
      style={
        selected
          ? { background: color, borderColor: color, color: '#fff', boxShadow: `0 6px 14px ${hexA(color, 0.35)}` }
          : { background: 'var(--mv-surface)', borderColor: 'var(--mv-border-2)', color }
      }
    >
      <Icon size={sm ? 13 : 16} color={selected ? '#fff' : color} />
      {name}
    </button>
  );
}
