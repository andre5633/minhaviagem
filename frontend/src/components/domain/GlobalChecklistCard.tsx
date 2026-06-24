import { useState } from 'react';
import { Check, Trash2, Pencil, Plus, X, Lock } from 'lucide-react';
import { Card } from '../ui/Card';
import { useApp } from '../../store/AppContext';
import { cn } from '../../lib/cn';
import type { GlobalChecklist, GlobalChecklistItem } from '../../types';

interface Props {
  checklist: GlobalChecklist;
  onAddItem: (text: string, responsible: string) => Promise<void>;
  onEditItem: (item: GlobalChecklistItem, data: { text: string; responsible: string }) => Promise<void>;
  onDeleteItem: (item: GlobalChecklistItem) => Promise<void>;
  onRename: (title: string) => Promise<void>;
  onToggleEnabled: () => void;
  onDelete: () => void;
}

export function GlobalChecklistCard({
  checklist,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onRename,
  onToggleEnabled,
  onDelete,
}: Props) {
  const { toast } = useApp();
  const [newText, setNewText] = useState('');
  const [newResp, setNewResp] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editResp, setEditResp] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(checklist.title);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    try {
      await onAddItem(newText.trim(), newResp.trim());
      setNewText('');
      setNewResp('');
    } catch {
      toast('Erro ao adicionar item', 'error');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (it: GlobalChecklistItem) => {
    setEditingId(it.id);
    setEditText(it.text);
    setEditResp(it.responsible ?? '');
  };

  const saveEdit = async (it: GlobalChecklistItem) => {
    if (!editText.trim()) return;
    try {
      await onEditItem(it, { text: editText.trim(), responsible: editResp.trim() });
      setEditingId(null);
    } catch {
      toast('Erro ao salvar item', 'error');
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
      <div className="border-b border-subtle px-4 pb-3 pt-4">
        <div className="flex items-start gap-2">
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
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-[16px] font-extrabold tracking-tight text-ink">{checklist.title}</h3>
                {checklist.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-1.5 py-0.5 text-[10px] font-bold text-faint" title="Lista padrão">
                    <Lock size={10} /> padrão
                  </span>
                )}
              </div>
            )}
            <div className="mt-0.5 text-[12px] text-faint">{checklist.items.length} itens</div>
          </div>

          <div className="flex flex-shrink-0 gap-0.5">
            {!renaming && (
              <button onClick={() => setRenaming(true)} aria-label="Renomear" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-subtle hover:text-ink-3 active:scale-90">
                <Pencil size={16} />
              </button>
            )}
            {!checklist.isDefault && (
              <button onClick={onDelete} aria-label="Excluir lista" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-bad-l hover:text-bad active:scale-90">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Toggle: entra em novas viagens */}
        <label className="mt-2.5 flex cursor-pointer items-center gap-2 select-none">
          <button
            type="button"
            role="switch"
            aria-checked={checklist.enabled}
            onClick={onToggleEnabled}
            className={cn('relative h-6 w-11 flex-shrink-0 rounded-full transition', checklist.enabled ? 'bg-primary' : 'bg-line-2')}
          >
            <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checklist.enabled ? 'left-[22px]' : 'left-0.5')} />
          </button>
          <span className="text-[12.5px] font-semibold text-muted" onClick={onToggleEnabled}>
            {checklist.enabled ? 'Entra em novas viagens' : 'Não entra em novas viagens'}
          </span>
        </label>
      </div>

      {/* Itens */}
      <div className="flex flex-col">
        {checklist.items.map((it) =>
          editingId === it.id ? (
            <div key={it.id} className="flex flex-col gap-1.5 border-b border-subtle px-4 py-2.5 sm:flex-row sm:items-center">
              <input className="mv-input h-9 flex-1 py-1" value={editText} autoFocus onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(it)} placeholder="Item" />
              <input className="mv-input h-9 py-1 sm:w-32" value={editResp} onChange={(e) => setEditResp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(it)} placeholder="Responsável" />
              <div className="flex gap-0.5">
                <button onClick={() => saveEdit(it)} aria-label="Salvar" className="flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-subtle"><Check size={18} /></button>
                <button onClick={() => setEditingId(null)} aria-label="Cancelar" className="flex h-9 w-9 items-center justify-center rounded-lg text-faint hover:bg-subtle"><X size={18} /></button>
              </div>
            </div>
          ) : (
            <div key={it.id} className="group flex items-center gap-3 border-b border-subtle px-4 py-2.5 transition last:border-b-0 hover:bg-surface-2">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-line-2" />
              <span className="min-w-0 flex-1 text-[14px] leading-snug text-ink">{it.text}</span>
              {it.responsible && (
                <span className="hidden flex-shrink-0 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-muted sm:inline-block">{it.responsible}</span>
              )}
              <div className="flex flex-shrink-0 gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                <button onClick={() => startEdit(it)} aria-label="Editar" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-subtle hover:text-ink-3 active:scale-90"><Pencil size={15} /></button>
                <button onClick={() => onDeleteItem(it).catch(() => toast('Erro ao excluir item', 'error'))} aria-label="Excluir" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-bad-l hover:text-bad active:scale-90"><Trash2 size={15} /></button>
              </div>
            </div>
          ),
        )}
        {checklist.items.length === 0 && <div className="px-4 py-4 text-center text-[13px] text-faint">Nenhum item ainda.</div>}
      </div>

      {/* Adicionar item */}
      <div className="flex flex-col gap-1.5 border-t border-subtle bg-surface-2/40 px-4 py-3 sm:flex-row sm:items-center">
        <input className="mv-input h-9 flex-1 py-1" placeholder="Novo item…" value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <input className="mv-input h-9 py-1 sm:w-32" placeholder="Responsável" value={newResp} onChange={(e) => setNewResp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
        <button
          onClick={handleAdd}
          disabled={!newText.trim() || adding}
          aria-label="Adicionar item"
          className="flex h-9 items-center justify-center gap-1 rounded-xl bg-[linear-gradient(135deg,var(--mv-primary),var(--mv-primary-d))] px-3 text-[13px] font-bold text-white transition active:scale-95 disabled:opacity-50"
        >
          <Plus size={17} />
          <span className="sm:hidden">Adicionar</span>
        </button>
      </div>
    </Card>
  );
}
