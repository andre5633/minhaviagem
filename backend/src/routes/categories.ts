import { Router } from 'express';
import { randomUUID } from 'crypto';
import type { Category } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/requireAuth';
import { DEFAULT_CATEGORIES } from '../lib/defaultCategories';

function serialize(c: Category) {
  return {
    id: c.id,
    key: c.key,
    name: c.name,
    icon: c.icon,
    color: c.color,
    isDefault: c.isDefault,
    position: c.position,
  };
}

// Semeia as categorias padrão na 1ª vez (por usuário).
export async function ensureCategories(userId: string) {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) return;
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c, i) => ({
      userId,
      key: c.key,
      name: c.name,
      icon: c.icon,
      color: c.color,
      isDefault: true,
      position: i,
    })),
  });
}

function own(id: string, userId: string) {
  return prisma.category.findFirst({ where: { id, userId } });
}

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

categoriesRouter.get('/', async (req, res) => {
  await ensureCategories(req.user!.id);
  const cats = await prisma.category.findMany({
    where: { userId: req.user!.id },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(cats.map(serialize));
});

categoriesRouter.post('/', async (req, res) => {
  const { name, icon, color } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Nome da categoria é obrigatório' });
    return;
  }
  const max = await prisma.category.aggregate({
    where: { userId: req.user!.id },
    _max: { position: true },
  });
  const cat = await prisma.category.create({
    data: {
      userId: req.user!.id,
      key: `c_${randomUUID().slice(0, 8)}`,
      name: name.trim(),
      icon: typeof icon === 'string' && icon ? icon : 'Tag',
      color: typeof color === 'string' && color ? color : '#8B8598',
      isDefault: false,
      position: (max._max.position ?? -1) + 1,
    },
  });
  res.status(201).json(serialize(cat));
});

categoriesRouter.put('/:id', async (req, res) => {
  const existing = await own(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Categoria não encontrada' });
    return;
  }
  const { name, icon, color } = req.body;
  const cat = await prisma.category.update({
    where: { id: req.params.id },
    data: {
      name: typeof name === 'string' && name.trim() ? name.trim() : undefined,
      icon: typeof icon === 'string' && icon ? icon : undefined,
      color: typeof color === 'string' && color ? color : undefined,
    },
  });
  res.json(serialize(cat));
});

categoriesRouter.delete('/:id', async (req, res) => {
  const existing = await own(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Categoria não encontrada' });
    return;
  }
  if (existing.isDefault) {
    res.status(400).json({ error: 'As categorias padrão não podem ser excluídas.' });
    return;
  }
  const inUse = await prisma.expense.count({
    where: { category: existing.key, trip: { userId: req.user!.id } },
  });
  if (inUse > 0) {
    res.status(400).json({ error: `Categoria em uso por ${inUse} despesa(s). Reatribua antes de excluir.` });
    return;
  }
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
