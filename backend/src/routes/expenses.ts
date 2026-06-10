import { Router } from 'express';
import type { Expense } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

export const expensesRouter = Router();
expensesRouter.use(requireAuth);

function serializeExpense(expense: Expense) {
  return {
    ...expense,
    amount: Number(expense.amount),
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
  };
}

// Verifica que a despesa pertence ao usuário logado (via trip)
async function ownExpense(expenseId: string, userId: string) {
  return prisma.expense.findFirst({
    where: { id: expenseId, trip: { userId } },
  });
}

expensesRouter.put('/:id', async (req, res) => {
  const existing = await ownExpense(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Despesa não encontrada' });
    return;
  }
  const { category, description, amount, expenseDate } = req.body;
  const expense = await prisma.expense.update({
    where: { id: req.params.id },
    data: {
      category,
      description,
      amount,
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
    },
  });
  res.json(serializeExpense(expense));
});

expensesRouter.delete('/:id', async (req, res) => {
  const existing = await ownExpense(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Despesa não encontrada' });
    return;
  }
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
