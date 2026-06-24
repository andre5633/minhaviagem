import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useGlobalChecklists } from '../../hooks/useGlobalChecklists';
import { useApp } from '../../store/AppContext';
import { GlobalChecklistCard } from './GlobalChecklistCard';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Skeleton } from '../ui/Skeleton';
import { Button } from '../ui/Button';
import type { GlobalChecklist } from '../../types';

export function GlobalChecklistEditor() {
  const { toast } = useApp();
  const {
    checklists,
    loading,
    createChecklist,
    renameChecklist,
    deleteChecklist,
    toggleEnabled,
    addItem,
    editItem,
    deleteItem,
  } = useGlobalChecklists();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [toDelete, setToDelete] = useState<GlobalChecklist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createChecklist(newName.trim());
      setNewName('');
      setCreating(false);
      toast('Lista criada!');
    } catch {
      toast('Erro ao criar lista', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteChecklist(toDelete.id);
      toast('Lista removida', 'delete');
      setToDelete(null);
    } catch {
      toast('Erro ao remover lista', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Estes são seus modelos. Toda nova viagem nasce com uma cópia das listas <strong>habilitadas</strong>.
        Aqui não há marcação de concluído — isso fica dentro de cada viagem.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {creating ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              className="mv-input h-11 flex-1"
              autoFocus
              placeholder="Nome da nova lista global"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setCreating(false);
                  setNewName('');
                }
              }}
            />
            <Button variant="primary" size="md" onClick={handleCreate}>
              Criar
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setCreating(false);
                setNewName('');
              }}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="md" leftIcon={<Plus size={18} />} onClick={() => setCreating(true)}>
            Nova lista global
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-card" />
          ))}
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {checklists.map((cl) => (
            <GlobalChecklistCard
              key={cl.id}
              checklist={cl}
              onAddItem={(text, responsible) => addItem(cl.id, text, responsible)}
              onEditItem={(item, data) => editItem(item, data)}
              onDeleteItem={deleteItem}
              onRename={(title) => renameChecklist(cl.id, title)}
              onToggleEnabled={() => toggleEnabled(cl)}
              onDelete={() => setToDelete(cl)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir lista global?"
        body={toDelete ? `“${toDelete.title}” será removida dos seus modelos. Viagens já criadas não são afetadas.` : ''}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
