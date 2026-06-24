import { useState } from 'react';
import { Check, Trash2, Pencil, Plus, X, ChevronDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { useApp } from '../../store/AppContext';
import { cn } from '../../lib/cn';
import type { Checklist, ChecklistTask } from '../../types';

interface Props {
  checklist: Checklist;
  onAddTask: (text: string, responsible: string) => Promise<void>;
  onToggleTask: (task: ChecklistTask) => void;
  onEditTask: (task: ChecklistTask, data: { text: string; responsible: string }) => Promise<void>;
  onDeleteTask: (task: ChecklistTask) => Promise<void>;
  onRename: (title: string) => Promise<void>;
  onDelete: () => void; // diálogo de confirmação fica no pai
}

export function ChecklistCard({
  checklist,
  onAddTask,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onRename,
  onDelete,
}: Props) {
  const { toast } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [newText, setNewText] = useState('');
  const [newResp, setNewResp] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editResp, setEditResp] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(checklist.title);

  const total = checklist.tasks.length;
  const done = checklist.tasks.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    try {
      await onAddTask(newText.trim(), newResp.trim());
      setNewText('');
      setNewResp('');
    } catch {
      toast('Erro ao adicionar tarefa', 'error');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (t: ChecklistTask) => {
    setEditingId(t.id);
    setEditText(t.text);
    setEditResp(t.responsible ?? '');
  };

  const saveEdit = async (t: ChecklistTask) => {
    if (!editText.trim()) return;
    try {
      await onEditTask(t, { text: editText.trim(), responsible: editResp.trim() });
      setEditingId(null);
    } catch {
      toast('Erro ao salvar tarefa', 'error');
    }
  };

  const saveRename = async () => {
    const t = titleDraft.trim();
    if (!t || t === checklist.title) {
      setRenaming(false);
      setTitleDraft(checklist.title);
      return;
    }
    try {
      await onRename(t);
      setRenaming(false);
    } catch {
      toast('Erro ao renomear', 'error');
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden p-0">
      {/* Cabeçalho */}
      <div className={cn('px-3 pb-3 pt-3.5', !collapsed && 'border-b border-subtle')}>
        <div className="flex items-start gap-1.5">
          {/* recolher/expandir */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir' : 'Recolher'}
            aria-expanded={!collapsed}
            className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-ink-3 transition hover:bg-subtle active:scale-90"
          >
            <ChevronDown size={18} className={cn('transition-transform', collapsed && '-rotate-90')} />
          </button>

          <div className="min-w-0 flex-1">
            {renaming ? (
              <div className="flex items-center gap-1.5">
                <input
                  className="mv-input h-9 py-1"
                  value={titleDraft}
                  autoFocus
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') {
                      setRenaming(false);
                      setTitleDraft(checklist.title);
                    }
                  }}
                />
                <button onClick={saveRename} aria-label="Salvar" className="flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-subtle">
                  <Check size={18} />
                </button>
              </div>
            ) : (
              <button onClick={() => setCollapsed((c) => !c)} className="block w-full text-left">
                <h3 className="truncate text-[16px] font-extrabold tracking-tight text-ink">{checklist.title}</h3>
              </button>
            )}
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[12px] font-bold text-faint">
                {done}/{total}
              </span>
            </div>
          </div>

          {/* Ações da lista */}
          <div className="flex flex-shrink-0 gap-0.5">
            {!renaming && (
              <button onClick={() => setRenaming(true)} aria-label="Renomear" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-subtle hover:text-ink-3 active:scale-90">
                <Pencil size={16} />
              </button>
            )}
            <button onClick={onDelete} aria-label="Excluir lista" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-bad-l hover:text-bad active:scale-90">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tarefas (somem quando recolhido) */}
      {!collapsed && (
        <>
          <div className="flex flex-col">
            {checklist.tasks.map((t) =>
              editingId === t.id ? (
                <div key={t.id} className="flex flex-col gap-1.5 border-b border-subtle px-4 py-2.5 sm:flex-row sm:items-center">
                  <input className="mv-input h-9 flex-1 py-1" value={editText} autoFocus onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(t)} placeholder="Tarefa" />
                  <input className="mv-input h-9 py-1 sm:w-32" value={editResp} onChange={(e) => setEditResp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(t)} placeholder="Responsável" />
                  <div className="flex gap-0.5">
                    <button onClick={() => saveEdit(t)} aria-label="Salvar" className="flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-subtle"><Check size={18} /></button>
                    <button onClick={() => setEditingId(null)} aria-label="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-lg text-faint hover:bg-subtle"><X size={18} /></button>
                  </div>
                </div>
              ) : (
                <div key={t.id} className="group flex items-center gap-3 border-b border-subtle px-4 py-2.5 transition last:border-b-0 hover:bg-surface-2">
                  <button
                    onClick={() => onToggleTask(t)}
                    aria-label={t.done ? 'Desmarcar' : 'Marcar'}
                    className={cn(
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition',
                      t.done ? 'border-primary bg-primary text-white' : 'border-line-2 text-transparent hover:border-primary',
                    )}
                  >
                    <Check size={13} strokeWidth={3.5} />
                  </button>
                  <span className={cn('min-w-0 flex-1 text-[14px] leading-snug', t.done ? 'text-faint line-through' : 'text-ink')}>
                    {t.text}
                  </span>
                  {t.responsible && (
                    <span className="hidden flex-shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-muted sm:inline-block">
                      {t.responsible}
                    </span>
                  )}
                  <div className="flex flex-shrink-0 gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                    <button onClick={() => startEdit(t)} aria-label="Editar" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-subtle hover:text-ink-3 active:scale-90"><Pencil size={15} /></button>
                    <button onClick={() => onDeleteTask(t).catch(() => toast('Erro ao excluir tarefa', 'error'))} aria-label="Excluir" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-bad-l hover:text-bad active:scale-90"><Trash2 size={15} /></button>
                  </div>
                </div>
              ),
            )}
            {total === 0 && <div className="px-4 py-4 text-center text-[13px] text-faint">Nenhuma tarefa ainda.</div>}
          </div>

          {/* Adicionar tarefa */}
          <div className="flex flex-col gap-1.5 border-t border-subtle bg-surface-2/40 px-4 py-3 sm:flex-row sm:items-center">
            <input className="mv-input h-9 flex-1 py-1" placeholder="Nova tarefa…" value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            <input className="mv-input h-9 py-1 sm:w-32" placeholder="Responsável" value={newResp} onChange={(e) => setNewResp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            <button
              onClick={handleAdd}
              disabled={!newText.trim() || adding}
              aria-label="Adicionar tarefa"
              className="flex h-9 items-center justify-center gap-1 rounded-xl bg-[linear-gradient(135deg,var(--mv-primary),var(--mv-primary-d))] px-3 text-[13px] font-bold text-white transition active:scale-95 disabled:opacity-50"
            >
              <Plus size={17} />
              <span className="sm:hidden">Adicionar</span>
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
