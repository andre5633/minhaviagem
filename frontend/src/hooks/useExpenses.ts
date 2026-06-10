import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import type { Expense } from '../types';

/** Despesas de uma viagem + ações. */
export function useExpenses(tripId: string | undefined) {
  const { expenses, addExpense, updateExpense, deleteExpense } = useApp();

  const tripExpenses = useMemo<Expense[]>(
    () => expenses.filter((e) => e.tripId === tripId),
    [expenses, tripId],
  );

  return { expenses: tripExpenses, addExpense, updateExpense, deleteExpense };
}
