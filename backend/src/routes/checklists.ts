import { Router } from 'express';
import type { Checklist, ChecklistTask } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';

// ── serialização ──
type ChecklistWithTasks = Checklist & { tasks: ChecklistTask[] };

export function serializeTask(t: ChecklistTask) {
  return {
    id: t.id,
    checklistId: t.checklistId,
    text: t.text,
    responsible: t.responsible,
    done: t.done,
    isDefault: t.isDefault,
    position: t.position,
  };
}

export function serializeChecklist(c: ChecklistWithTasks) {
  return {
    id: c.id,
    tripId: c.tripId,
    title: c.title,
    isDefault: c.isDefault,
    hidden: c.hidden,
    position: c.position,
    tasks: c.tasks.map(serializeTask),
  };
}

// ── ownership ──
function ownChecklist(id: string, userId: string) {
  return prisma.checklist.findFirst({ where: { id, trip: { userId } } });
}
function ownTask(id: string, userId: string) {
  return prisma.checklistTask.findFirst({ where: { id, checklist: { trip: { userId } } } });
}

// ═══════════════════ /api/checklists ═══════════════════
export const checklistsRouter = Router();
checklistsRouter.use(requireAuth);

checklistsRouter.put('/:id', async (req, res) => {
  const existing = await ownChecklist(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Checklist não encontrado' });
    return;
  }
  const { title, hidden } = req.body;
  const updated = await prisma.checklist.update({
    where: { id: req.params.id },
    data: {
      title: typeof title === 'string' ? title : undefined,
      hidden: typeof hidden === 'boolean' ? hidden : undefined,
    },
    include: { tasks: { orderBy: { position: 'asc' } } },
  });
  res.json(serializeChecklist(updated));
});

checklistsRouter.delete('/:id', async (req, res) => {
  const existing = await ownChecklist(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Checklist não encontrado' });
    return;
  }
  await prisma.checklist.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

checklistsRouter.post('/:id/tasks', async (req, res) => {
  const checklist = await ownChecklist(req.params.id, req.user!.id);
  if (!checklist) {
    res.status(404).json({ error: 'Checklist não encontrado' });
    return;
  }
  const { text, responsible } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Descrição da tarefa é obrigatória' });
    return;
  }
  const count = await prisma.checklistTask.count({ where: { checklistId: req.params.id } });
  const task = await prisma.checklistTask.create({
    data: {
      checklistId: req.params.id,
      text: text.trim(),
      responsible: responsible ?? null,
      position: count,
    },
  });
  res.status(201).json(serializeTask(task));
});

// ═══════════════════ /api/tasks ═══════════════════
export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.put('/:id', async (req, res) => {
  const existing = await ownTask(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Tarefa não encontrada' });
    return;
  }
  const { text, responsible, done } = req.body;
  const task = await prisma.checklistTask.update({
    where: { id: req.params.id },
    data: {
      text: typeof text === 'string' ? text : undefined,
      responsible: responsible === undefined ? undefined : responsible,
      done: typeof done === 'boolean' ? done : undefined,
    },
  });
  res.json(serializeTask(task));
});

tasksRouter.delete('/:id', async (req, res) => {
  const existing = await ownTask(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Tarefa não encontrada' });
    return;
  }
  await prisma.checklistTask.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
