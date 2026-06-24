import { Router } from 'express';
import type { GlobalChecklist, GlobalChecklistItem } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { DEFAULT_CHECKLISTS } from '../lib/defaultChecklists';

type GlobalWithItems = GlobalChecklist & { items: GlobalChecklistItem[] };

function serializeItem(i: GlobalChecklistItem) {
  return { id: i.id, checklistId: i.checklistId, text: i.text, responsible: i.responsible, position: i.position };
}
function serializeGlobal(c: GlobalWithItems) {
  return {
    id: c.id,
    title: c.title,
    isDefault: c.isDefault,
    enabled: c.enabled,
    position: c.position,
    items: c.items.map(serializeItem),
  };
}

// Garante que o usuário tenha as 3 listas globais padrão (semeia na 1ª vez).
export async function ensureGlobalChecklists(userId: string) {
  const count = await prisma.globalChecklist.count({ where: { userId } });
  if (count > 0) return;
  for (let i = 0; i < DEFAULT_CHECKLISTS.length; i++) {
    const cl = DEFAULT_CHECKLISTS[i];
    await prisma.globalChecklist.create({
      data: {
        userId,
        title: cl.title,
        isDefault: true,
        enabled: true,
        position: i,
        items: { create: cl.tasks.map((t, j) => ({ text: t.text, responsible: t.responsible, position: j })) },
      },
    });
  }
}

// Copia as listas globais HABILITADAS do usuário para uma viagem (cópia/snapshot).
export async function copyGlobalsToTrip(userId: string, tripId: string) {
  await ensureGlobalChecklists(userId);
  const globals = await prisma.globalChecklist.findMany({
    where: { userId, enabled: true },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    include: { items: { orderBy: { position: 'asc' } } },
  });
  for (const g of globals) {
    await prisma.checklist.create({
      data: {
        tripId,
        title: g.title,
        position: g.position,
        tasks: { create: g.items.map((it, j) => ({ text: it.text, responsible: it.responsible, position: j })) },
      },
    });
  }
}

// ── ownership ──
function ownGlobal(id: string, userId: string) {
  return prisma.globalChecklist.findFirst({ where: { id, userId } });
}
function ownGlobalItem(id: string, userId: string) {
  return prisma.globalChecklistItem.findFirst({ where: { id, checklist: { userId } } });
}

// ═══════════════════ /api/global-checklists ═══════════════════
export const globalChecklistsRouter = Router();
globalChecklistsRouter.use(requireAuth);

globalChecklistsRouter.get('/', async (req, res) => {
  await ensureGlobalChecklists(req.user!.id);
  const lists = await prisma.globalChecklist.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    include: { items: { orderBy: { position: 'asc' } } },
  });
  res.json(lists.map(serializeGlobal));
});

globalChecklistsRouter.post('/', async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    res.status(400).json({ error: 'Nome da lista é obrigatório' });
    return;
  }
  const max = await prisma.globalChecklist.aggregate({
    where: { userId: req.user!.id },
    _max: { position: true },
  });
  const list = await prisma.globalChecklist.create({
    data: {
      userId: req.user!.id,
      title: title.trim(),
      isDefault: false,
      enabled: true,
      position: (max._max.position ?? -1) + 1,
    },
    include: { items: true },
  });
  res.status(201).json(serializeGlobal(list));
});

globalChecklistsRouter.put('/:id', async (req, res) => {
  const existing = await ownGlobal(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Lista não encontrada' });
    return;
  }
  const { title, enabled } = req.body;
  const updated = await prisma.globalChecklist.update({
    where: { id: req.params.id },
    data: {
      title: typeof title === 'string' ? title : undefined,
      enabled: typeof enabled === 'boolean' ? enabled : undefined,
    },
    include: { items: { orderBy: { position: 'asc' } } },
  });
  res.json(serializeGlobal(updated));
});

globalChecklistsRouter.delete('/:id', async (req, res) => {
  const existing = await ownGlobal(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Lista não encontrada' });
    return;
  }
  if (existing.isDefault) {
    res.status(400).json({ error: 'As listas padrão não podem ser excluídas — desabilite-as para não entrarem em novas viagens.' });
    return;
  }
  await prisma.globalChecklist.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

globalChecklistsRouter.post('/:id/items', async (req, res) => {
  const list = await ownGlobal(req.params.id, req.user!.id);
  if (!list) {
    res.status(404).json({ error: 'Lista não encontrada' });
    return;
  }
  const { text, responsible } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Descrição do item é obrigatória' });
    return;
  }
  const count = await prisma.globalChecklistItem.count({ where: { checklistId: req.params.id } });
  const item = await prisma.globalChecklistItem.create({
    data: { checklistId: req.params.id, text: text.trim(), responsible: responsible ?? null, position: count },
  });
  res.status(201).json(serializeItem(item));
});

// ═══════════════════ /api/global-items ═══════════════════
export const globalItemsRouter = Router();
globalItemsRouter.use(requireAuth);

globalItemsRouter.put('/:id', async (req, res) => {
  const existing = await ownGlobalItem(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Item não encontrado' });
    return;
  }
  const { text, responsible } = req.body;
  const item = await prisma.globalChecklistItem.update({
    where: { id: req.params.id },
    data: {
      text: typeof text === 'string' ? text : undefined,
      responsible: responsible === undefined ? undefined : responsible,
    },
  });
  res.json(serializeItem(item));
});

globalItemsRouter.delete('/:id', async (req, res) => {
  const existing = await ownGlobalItem(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Item não encontrado' });
    return;
  }
  await prisma.globalChecklistItem.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
