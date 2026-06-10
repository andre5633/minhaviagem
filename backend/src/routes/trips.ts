import { Router } from 'express';
import type { Trip, Expense } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

export const tripsRouter = Router();
tripsRouter.use(requireAuth);

function serializeTrip(trip: Trip) {
  return {
    ...trip,
    startDate: trip.startDate.toISOString().slice(0, 10),
    endDate: trip.endDate.toISOString().slice(0, 10),
    totalBudget: Number(trip.totalBudget),
  };
}

function serializeExpense(expense: Expense) {
  return {
    ...expense,
    amount: Number(expense.amount),
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
  };
}

tripsRouter.get('/', async (req, res) => {
  const trips = await prisma.trip.findMany({
    where: { userId: req.user!.id },
    orderBy: { startDate: 'desc' },
  });
  res.json(trips.map(serializeTrip));
});

tripsRouter.get('/:id', async (req, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!trip) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }
  res.json(serializeTrip(trip));
});

tripsRouter.post('/', async (req, res) => {
  const { title, destination, startDate, endDate, totalBudget, cover, coverImage } = req.body;
  const trip = await prisma.trip.create({
    data: {
      userId: req.user!.id,
      title,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalBudget,
      cover,
      coverImage: coverImage ?? null,
    },
  });
  res.status(201).json(serializeTrip(trip));
});

tripsRouter.put('/:id', async (req, res) => {
  const existing = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }
  const { title, destination, startDate, endDate, totalBudget, cover, coverImage } = req.body;
  const trip = await prisma.trip.update({
    where: { id: req.params.id },
    data: {
      title,
      destination,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      totalBudget,
      cover,
      coverImage,
    },
  });
  res.json(serializeTrip(trip));
});

tripsRouter.delete('/:id', async (req, res) => {
  const existing = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!existing) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }
  await prisma.trip.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// Despesas aninhadas na viagem
tripsRouter.get('/:id/expenses', async (req, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!trip) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }
  const expenses = await prisma.expense.findMany({
    where: { tripId: req.params.id },
    orderBy: { expenseDate: 'desc' },
  });
  res.json(expenses.map(serializeExpense));
});

tripsRouter.post('/:id/expenses', async (req, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!trip) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }
  const { category, description, amount, expenseDate } = req.body;
  const expense = await prisma.expense.create({
    data: {
      tripId: req.params.id,
      category,
      description,
      amount,
      expenseDate: new Date(expenseDate),
    },
  });
  res.status(201).json(serializeExpense(expense));
});
