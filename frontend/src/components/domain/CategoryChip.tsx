import { CATEGORY_MAP } from '../../lib/categories';
import { hexA } from '../../lib/cn';
import type { CategoryKey } from '../../types';

interface CategoryChipProps {
  category: CategoryKey;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function CategoryChip({ category, selected, onClick, size = 'md' }: CategoryChipProps) {
  const def = CATEGORY_MAP[category];
  const Icon = def.Icon;
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
          ? { background: def.color, borderColor: def.color, color: '#fff', boxShadow: `0 6px 14px ${hexA(def.color, 0.35)}` }
          : { background: 'var(--mv-surface)', borderColor: 'var(--mv-border-2)', color: def.color }
      }
    >
      <Icon size={sm ? 13 : 16} color={selected ? '#fff' : def.color} />
      {category}
    </button>
  );
}
