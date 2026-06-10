import { useEffect, useState } from 'react';
import { Check, Info } from 'lucide-react';
import { CATEGORIES } from '../../lib/categories';
import { CategoryChip } from './CategoryChip';
import { Button } from '../ui/Button';
import { useApp } from '../../store/AppContext';
import { currencyToNumber, numberToCurrencyInput, todayISO } from '../../lib/formatters';
import type { CategoryKey } from '../../types';

interface ExpenseFormProps {
  onDone?: () => void;
}

export function ExpenseForm(_props: ExpenseFormProps = {}) {
  const { sheet, addExpense, updateExpense, closeExpenseSheet, toast } = useApp();
  const editing = sheet.mode === 'edit' ? sheet.expense : null;

  const [category, setCategory] = useState<CategoryKey>('Alimentação');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (editing) {
      setCategory(editing.category);
      setDescription(editing.description);
      setAmountStr(numberToCurrencyInput(editing.amount));
      setDate(editing.expenseDate);
    } else {
      setCategory('Alimentação');
      setDescription('');
      setAmountStr('');
      setDate(todayISO());
    }
    setSaving(false);
    setTries(0);
  }, [editing, sheet.open]);

  const amount = currencyToNumber(amountStr);
  const valid = description.trim() !== '' && amount > 0;

  const confirm = async () => {
    setTries((t) => t + 1);
    if (!valid || !sheet.tripId) return;
    setSaving(true);
    const payload = {
      category,
      description: description.trim(),
      amount,
      expenseDate: date,
      tripId: sheet.tripId as string,
    };
    try {
      if (editing) {
        await updateExpense(editing.id, payload);
        toast('Despesa atualizada');
      } else {
        await addExpense(payload);
        toast('Despesa lançada!');
      }
      closeExpenseSheet();
    } catch (err) {
      setSaving(false);
      toast(err instanceof Error ? err.message : 'Erro ao salvar despesa', 'error');
    }
  };

  return (
    <div>
      <label className="mv-label">Categoria</label>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <CategoryChip
            key={c.key}
            category={c.key}
            selected={category === c.key}
            onClick={() => setCategory(c.key)}
          />
        ))}
      </div>

      <div className="mt-[18px]">
        <label className="mv-label">Descrição</label>
        <input
          className={'mv-input' + (tries && !description.trim() ? ' mv-input--err' : '')}
          value={description}
          placeholder="Ex: Museu do Louvre"
          onChange={(e) => setDescription(e.target.value)}
        />
        {tries > 0 && !description.trim() && (
          <span className="mt-1.5 flex items-center gap-1 pl-0.5 text-xs font-semibold text-bad">
            <Info size={13} /> Descreva a despesa
          </span>
        )}
      </div>

      <div className="mt-3.5 flex gap-3">
        <div className="flex-[1.2]">
          <label className="mv-label">Valor</label>
          <div className="mv-input flex items-center gap-2 !px-3.5">
            <span className="text-[15px] font-bold text-faint">R$</span>
            <input
              className="w-full border-none bg-transparent text-[15px] font-medium text-ink outline-none"
              inputMode="numeric"
              value={amountStr}
              placeholder="0,00"
              onChange={(e) => setAmountStr(numberToCurrencyInput(currencyToNumber(e.target.value)))}
            />
          </div>
          {tries > 0 && amount <= 0 && (
            <span className="mt-1.5 flex items-center gap-1 pl-0.5 text-xs font-semibold text-bad">
              <Info size={13} /> Informe o valor
            </span>
          )}
        </div>
        <div className="flex-1">
          <label className="mv-label">Data</label>
          <input type="date" className="mv-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:justify-end">
        <Button variant="ghost" size="lg" className="hidden lg:inline-flex" onClick={closeExpenseSheet}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="lg"
          block
          className="lg:w-auto"
          loading={saving}
          onClick={confirm}
          leftIcon={saving ? undefined : <Check size={20} />}
        >
          {editing ? 'Salvar alterações' : 'Confirmar despesa'}
        </Button>
      </div>
    </div>
  );
}
