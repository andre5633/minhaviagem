import { Router } from 'express';
import type { Trip, Expense } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { serializeChecklist } from './checklists';
import { copyGlobalsToTrip } from './globalChecklists';

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

// Checklists da viagem
tripsRouter.get('/:id/checklists', async (req, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!trip) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }
  // Lazy: na 1ª vez, copia as listas globais habilitadas do usuário para a viagem
  const count = await prisma.checklist.count({ where: { tripId: req.params.id } });
  if (count === 0) {
    await copyGlobalsToTrip(req.user!.id, req.params.id);
  }
  const checklists = await prisma.checklist.findMany({
    where: { tripId: req.params.id },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    include: { tasks: { orderBy: { position: 'asc' } } },
  });
  res.json(checklists.map(serializeChecklist));
});

tripsRouter.post('/:id/checklists', async (req, res) => {
  const trip = await prisma.trip.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });
  if (!trip) {
    res.status(404).json({ error: 'Viagem não encontrada' });
    return;
  }
  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Nome do checklist é obrigatório' });
    return;
  }
  const max = await prisma.checklist.aggregate({
    where: { tripId: req.params.id },
    _max: { position: true },
  });
  const checklist = await prisma.checklist.create({
    data: {
      tripId: req.params.id,
      title: title.trim(),
      isDefault: false,
      position: (max._max.position ?? -1) + 1,
    },
    include: { tasks: true },
  });
  res.status(201).json(serializeChecklist(checklist));
});
