import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { GlobalChecklist, GlobalChecklistItem } from '../types';

/** Modelos globais do usuário (Perfil > Meu Checklist). */
export function useGlobalChecklists() {
  const [checklists, setChecklists] = useState<GlobalChecklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .listGlobalChecklists()
      .then((d) => active && setChecklists(d))
      .catch(() => active && setChecklists([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const createChecklist = useCallback(async (title: string) => {
    const cl = await api.createGlobalChecklist(title);
    setChecklists((prev) => [...prev, cl]);
  }, []);

  const renameChecklist = useCallback(async (id: string, title: string) => {
    const cl = await api.updateGlobalChecklist(id, { title });
    setChecklists((prev) => prev.map((c) => (c.id === id ? cl : c)));
  }, []);

  const deleteChecklist = useCallback(async (id: string) => {
    await api.deleteGlobalChecklist(id);
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // otimista — o switch de "entrar em novas viagens" responde na hora
  const toggleEnabled = useCallback(async (cl: GlobalChecklist) => {
    const next = !cl.enabled;
    setChecklists((prev) => prev.map((c) => (c.id === cl.id ? { ...c, enabled: next } : c)));
    try {
      await api.updateGlobalChecklist(cl.id, { enabled: next });
    } catch {
      setChecklists((prev) => prev.map((c) => (c.id === cl.id ? { ...c, enabled: !next } : c)));
    }
  }, []);

  const addItem = useCallback(async (checklistId: string, text: string, responsible?: string | null) => {
    const item = await api.addGlobalItem(checklistId, { text, responsible });
    setChecklists((prev) =>
      prev.map((c) => (c.id === checklistId ? { ...c, items: [...c.items, item] } : c)),
    );
  }, []);

  const editItem = useCallback(
    async (item: GlobalChecklistItem, data: { text?: string; responsible?: string | null }) => {
      const updated = await api.updateGlobalItem(item.id, data);
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === item.checklistId
            ? { ...c, items: c.items.map((i) => (i.id === item.id ? updated : i)) }
            : c,
        ),
      );
    },
    [],
  );

  const deleteItem = useCallback(async (item: GlobalChecklistItem) => {
    await api.deleteGlobalItem(item.id);
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === item.checklistId ? { ...c, items: c.items.filter((i) => i.id !== item.id) } : c,
      ),
    );
  }, []);

  return {
    checklists,
    loading,
    createChecklist,
    renameChecklist,
    deleteChecklist,
    toggleEnabled,
    addItem,
    editItem,
    deleteItem,
  };
}
