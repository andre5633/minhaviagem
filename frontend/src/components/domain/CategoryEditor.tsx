import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, Lock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CATEGORY_ICON_NAMES, CATEGORY_COLORS, resolveIcon } from '../../lib/categoryIcons';
import { cn, hexA } from '../../lib/cn';
import type { Category } from '../../types';

interface FormState {
  name: string;
  icon: string;
  color: string;
}

export function CategoryEditor() {
  const { categories, createCategory, updateCategory, deleteCategory, toast } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null); // id da categoria ou 'new'
  const [form, setForm] = useState<FormState>({ name: '', icon: 'Tag', color: CATEGORY_COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const startNew = () => {
    setForm({ name: '', icon: 'Tag', color: CATEGORY_COLORS[0] });
    setEditingId('new');
  };
  const startEdit = (c: Category) => {
    setForm({ name: c.name, icon: c.icon, color: c.color });
    setEditingId(c.id);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingId === 'new') {
        await createCategory({ name: form.name.trim(), icon: form.icon, color: form.color });
        toast('Categoria criada!');
      } else if (editingId) {
        await updateCategory(editingId, { name: form.name.trim(), icon: form.icon, color: form.color });
        toast('Categoria salva');
      }
      setEditingId(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao salvar categoria', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteCategory(toDelete.id);
      toast('Categoria removida', 'delete');
      setToDelete(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao remover categoria', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Personalize as categorias das despesas — nome, ícone e cor. As padrão não podem ser excluídas; as suas, sim
        (desde que não estejam em uso).
      </p>

      <div className="mb-4">
        {editingId === 'new' ? (
          <CategoryForm form={form} setForm={setForm} onSave={save} onCancel={() => setEditingId(null)} saving={saving} />
        ) : (
          <Button variant="primary" size="md" leftIcon={<Plus size={18} />} onClick={startNew}>
            Nova categoria
          </Button>
        )}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {categories.map((c) => {
          const Icon = resolveIcon(c.icon);
          if (editingId === c.id) {
            return (
              <div key={c.id} className="sm:col-span-2">
                <CategoryForm form={form} setForm={setForm} onSave={save} onCancel={() => setEditingId(null)} saving={saving} />
              </div>
            );
          }
          return (
            <Card key={c.id} className="flex items-center gap-3 p-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: hexA(c.color, 0.14) }}>
                <Icon size={20} color={c.color} />
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="truncate font-bold text-ink">{c.name}</span>
                {c.isDefault && (
                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-subtle px-1.5 py-0.5 text-[10px] font-bold text-faint">
                    <Lock size={10} /> padrão
                  </span>
                )}
              </div>
              <button onClick={() => startEdit(c)} aria-label="Editar" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-subtle hover:text-ink-3 active:scale-90">
                <Pencil size={16} />
              </button>
              {!c.isDefault && (
                <button onClick={() => setToDelete(c)} aria-label="Excluir" className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-bad-l hover:text-bad active:scale-90">
                  <Trash2 size={16} />
                </button>
              )}
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir categoria?"
        body={toDelete ? `“${toDelete.name}” será removida das suas categorias.` : ''}
        confirmLabel="Excluir"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function CategoryForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const Preview = resolveIcon(form.icon);
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: hexA(form.color, 0.15) }}>
          <Preview size={22} color={form.color} />
        </span>
        <input
          className="mv-input flex-1"
          autoFocus
          placeholder="Nome da categoria"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
        />
      </div>

      <div className="mv-label mb-1.5">Ícone</div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CATEGORY_ICON_NAMES.map((n) => {
          const I = resolveIcon(n);
          const on = form.icon === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setForm((f) => ({ ...f, icon: n }))}
              aria-label={n}
              className={cn('flex h-9 w-9 items-center justify-center rounded-lg border transition active:scale-90', on ? 'border-primary' : 'border-line hover:bg-subtle')}
              style={on ? { background: hexA(form.color, 0.15) } : undefined}
            >
              <I size={18} color={on ? form.color : 'var(--mv-muted)'} />
            </button>
          );
        })}
      </div>

      <div className="mv-label mb-1.5">Cor</div>
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORY_COLORS.map((col) => (
          <button
            key={col}
            type="button"
            onClick={() => setForm((f) => ({ ...f, color: col }))}
            aria-label={col}
            className="h-7 w-7 rounded-full transition active:scale-90"
            style={{ background: col, boxShadow: form.color === col ? `0 0 0 2px var(--mv-surface), 0 0 0 4px ${col}` : undefined }}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="md" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="primary" size="md" loading={saving} leftIcon={<Check size={18} />} onClick={onSave}>
          Salvar
        </Button>
      </div>
    </Card>
  );
}
