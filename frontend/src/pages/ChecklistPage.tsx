import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, ListChecks } from 'lucide-react';
import { useTrip } from '../hooks/useTrips';
import { useChecklists } from '../hooks/useChecklists';
import { useApp } from '../store/AppContext';
import { TripHeader } from '../components/domain/TripHeader';
import { ChecklistCard } from '../components/domain/ChecklistCard';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import type { Checklist } from '../types';

export function ChecklistPage() {
  const { id } = useParams();
  const { trip, summary } = useTrip(id);
  const { toast } = useApp();
  const {
    checklists,
    loading,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    addTask,
    editTask,
    toggleTask,
    deleteTask,
  } = useChecklists(id);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [toDelete, setToDelete] = useState<Checklist | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!trip || !summary) return null;

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createChecklist(newName.trim());
      setNewName('');
      setCreating(false);
      toast('Checklist criado!');
    } catch {
      toast('Erro ao criar checklist', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteChecklist(toDelete.id);
      toast('Checklist removido', 'delete');
      setToDelete(null);
    } catch {
      toast('Erro ao remover checklist', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1080px] px-5 pb-28 pt-0 lg:px-10 lg:pb-12 lg:pt-8">
      <TripHeader trip={trip} summary={summary} current="checklist" />

      <div className="pt-4 lg:pt-6">
        {loading ? (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-card" />
            ))}
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {creating ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    className="mv-input h-11 flex-1"
                    autoFocus
                    placeholder="Nome do novo checklist"
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
                  Novo checklist
                </Button>
              )}
            </div>

            {checklists.length === 0 ? (
              <div className="mx-auto mt-10 flex max-w-sm flex-col items-center text-center">
                <ListChecks size={44} className="text-faint" strokeWidth={1.8} />
                <p className="mt-3 text-sm text-muted">Nenhum checklist nesta viagem. Crie um novo para começar.</p>
              </div>
            ) : (
              <div className="grid items-start gap-4 lg:grid-cols-2">
                {checklists.map((cl) => (
                  <ChecklistCard
                    key={cl.id}
                    checklist={cl}
                    onAddTask={(text, responsible) => addTask(cl.id, text, responsible)}
                    onToggleTask={toggleTask}
                    onEditTask={(task, data) => editTask(task, data)}
                    onDeleteTask={deleteTask}
                    onRename={(title) => updateChecklist(cl.id, { title })}
                    onDelete={() => setToDelete(cl)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir checklist?"
        body={toDelete ? `“${toDelete.title}” e todas as suas tarefas serão removidos.` : ''}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
