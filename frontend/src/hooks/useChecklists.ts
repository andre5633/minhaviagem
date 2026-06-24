import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Checklist, ChecklistTask } from '../types';

/** Checklists de uma viagem + ações. Carrega sob demanda (GET /api/trips/:id/checklists). */
export function useChecklists(tripId: string | undefined) {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;
    let active = true;
    setLoading(true);
    api
      .listChecklists(tripId)
      .then((data) => active && setChecklists(data))
      .catch(() => active && setChecklists([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tripId]);

  const createChecklist = useCallback(
    async (title: string) => {
      if (!tripId) return;
      const cl = await api.createChecklist(tripId, title);
      setChecklists((prev) => [...prev, cl]);
    },
    [tripId],
  );

  const updateChecklist = useCallback(async (id: string, data: { title?: string; hidden?: boolean }) => {
    const cl = await api.updateChecklist(id, data);
    setChecklists((prev) => prev.map((c) => (c.id === id ? cl : c)));
  }, []);

  const deleteChecklist = useCallback(async (id: string) => {
    await api.deleteChecklist(id);
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addTask = useCallback(async (checklistId: string, text: string, responsible?: string | null) => {
    const task = await api.addTask(checklistId, { text, responsible });
    setChecklists((prev) =>
      prev.map((c) => (c.id === checklistId ? { ...c, tasks: [...c.tasks, task] } : c)),
    );
  }, []);

  const editTask = useCallback(
    async (task: ChecklistTask, data: { text?: string; responsible?: string | null }) => {
      const updated = await api.updateTask(task.id, data);
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === task.checklistId
            ? { ...c, tasks: c.tasks.map((t) => (t.id === task.id ? updated : t)) }
            : c,
        ),
      );
    },
    [],
  );

  // otimista — o check responde na hora; reverte se a API falhar
  const toggleTask = useCallback(async (task: ChecklistTask) => {
    const next = !task.done;
    const flip = (done: boolean) =>
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === task.checklistId
            ? { ...c, tasks: c.tasks.map((t) => (t.id === task.id ? { ...t, done } : t)) }
            : c,
        ),
      );
    flip(next);
    try {
      await api.updateTask(task.id, { done: next });
    } catch {
      flip(!next);
    }
  }, []);

  const deleteTask = useCallback(async (task: ChecklistTask) => {
    await api.deleteTask(task.id);
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === task.checklistId ? { ...c, tasks: c.tasks.filter((t) => t.id !== task.id) } : c,
      ),
    );
  }, []);

  return {
    checklists,
    loading,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    addTask,
    editTask,
    toggleTask,
    deleteTask,
  };
}
