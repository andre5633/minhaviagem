import { Pencil, Trash2 } from 'lucide-react';
import { CATEGORY_MAP } from '../../lib/categories';
import { hexA } from '../../lib/cn';
import { formatBRLShort, formatBRL } from '../../lib/formatters';
import type { Expense } from '../../types';

interface ExpenseItemProps {
  expense: Expense;
  /** layout 'card' (mobile) ou 'row' (tabela desktop) */
  variant?: 'card' | 'row';
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseItem({ expense, variant = 'card', onEdit, onDelete }: ExpenseItemProps) {
  const def = CATEGORY_MAP[expense.category];
  const Icon = def.Icon;

  if (variant === 'row') {
    return (
      <div className="group flex items-center gap-4 border-b border-subtle px-5 py-3.5 transition last:border-b-0 hover:bg-surface-2">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: hexA(def.color, 0.13) }}
        >
          <Icon size={20} color={def.color} />
        </span>
        <div className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-ink">{expense.description}</div>
        <span
          className="hidden rounded-full px-2.5 py-[3px] text-[11.5px] font-bold sm:inline-flex"
          style={{ background: hexA(def.color, 0.14), color: def.color }}
        >
          {expense.category}
        </span>
        <div className="w-[120px] text-right text-[14.5px] font-extrabold text-ink">{formatBRL(expense.amount)}</div>
        <div className="flex w-[72px] justify-end gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
          <button
            onClick={onEdit}
            aria-label="Editar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 transition hover:bg-subtle active:scale-90"
          >
            <Pencil size={17} />
          </button>
          <button
            onClick={onDelete}
            aria-label="Excluir"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-3 transition hover:bg-bad-l hover:text-bad active:scale-90"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    );
  }

  // card (mobile)
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface px-3.5 py-3 shadow-card">
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: hexA(def.color, 0.13) }}
      >
        <Icon size={20} color={def.color} />
      </span>
      <button className="min-w-0 flex-1 text-left" onClick={onEdit}>
        <div className="truncate text-[14.5px] font-semibold text-ink">{expense.description}</div>
        <div className="mt-px text-xs text-faint">{expense.category}</div>
      </button>
      <div className="text-[14.5px] font-extrabold tracking-tight text-ink">{formatBRLShort(expense.amount)}</div>
      <button
        onClick={onDelete}
        aria-label="Excluir"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-faint transition hover:bg-bad-l hover:text-bad active:scale-90"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}
