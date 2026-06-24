import { useCallback, useEffect, useState } from 'react';
import {
  Lock,
  Search,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  ChevronUp,
  ChevronDown,
  Download,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { cn } from '../lib/cn';
import type { AdminUser, AdminUsersResponse } from '../types';

type Phase = 'loading' | 'gate' | 'authed';

function fmt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const COLUMNS: { key: string; label: string; sortable: boolean }[] = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'createdAt', label: 'Cadastro', sortable: true },
  { key: 'lastCreate', label: 'Último lançamento', sortable: true },
];

export function AdminPage() {
  const [phase, setPhase] = useState<Phase>('loading');

  // gate
  const [password, setPassword] = useState('');
  const [gateError, setGateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // tabela
  const [resp, setResp] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // seleção / exportação
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false); // todos do filtro (todas as páginas)
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api
      .adminMe()
      .then(() => setPhase('authed'))
      .catch(() => setPhase('gate'));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminUsers({ page, pageSize, q, sort, order });
      setResp(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setPhase('gate');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q, sort, order]);

  useEffect(() => {
    if (phase === 'authed') load();
  }, [phase, load]);

  const submitGate = async () => {
    if (!password) return;
    setSubmitting(true);
    setGateError('');
    try {
      await api.adminLogin(password);
      setPassword('');
      setPhase('authed');
    } catch (e) {
      setGateError(e instanceof Error ? e.message : 'Senha incorreta');
    } finally {
      setSubmitting(false);
    }
  };

  const clearSelection = () => {
    setSelected(new Set());
    setAllMatching(false);
  };

  const logout = async () => {
    try {
      await api.adminLogout();
    } catch {
      /* ignora */
    }
    setResp(null);
    clearSelection();
    setPhase('gate');
  };

  const applySearch = () => {
    setPage(1);
    clearSelection(); // novo filtro → zera seleção
    setQ(qInput.trim());
  };

  // seleção
  const pageIds = resp?.data.map((u) => u.id) ?? [];
  const allCurrentSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const selectionCount = allMatching ? resp?.total ?? 0 : selected.size;

  const toggleRow = (id: string) => {
    setAllMatching(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCurrentPage = () => {
    if (allMatching) {
      clearSelection();
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      if (allCurrentSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const doExport = async () => {
    if (selectionCount === 0) return;
    setExporting(true);
    try {
      const rows = allMatching
        ? await api.adminUsersExport({ all: true, q })
        : await api.adminUsersExport({ ids: [...selected] });
      const XLSX = await import('xlsx');
      const sheet = rows.map((u) => ({
        Nome: u.name,
        Email: u.email,
        Cadastro: fmt(u.createdAt),
        'Último lançamento': fmt(u.lastCreate),
      }));
      const ws = XLSX.utils.json_to_sheet(sheet);
      ws['!cols'] = [{ wch: 28 }, { wch: 34 }, { wch: 18 }, { wch: 18 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuários');
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `usuarios-minhaviagem-${stamp}.xlsx`);
    } catch {
      /* noop */
    } finally {
      setExporting(false);
    }
  };

  const toggleSort = (key: string) => {
    if (sort === key) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      setOrder('asc');
    }
    setPage(1);
  };

  // ─── Gate de senha ───
  if (phase === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-bg">
        <Spinner size={32} />
      </div>
    );
  }

  if (phase === 'gate') {
    return (
      <div className="relative flex h-full items-center justify-center bg-bg px-5">
        <ThemeToggle className="absolute right-4 top-4" />
        <Card className="w-full max-w-sm p-7">
          <div className="mb-5 flex flex-col items-center text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
              <Lock className="text-primary" size={26} />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight text-ink">Área administrativa</h1>
            <p className="mt-1 text-sm text-muted">Acesso restrito — informe a senha.</p>
          </div>
          <input
            type="password"
            className={'mv-input' + (gateError ? ' mv-input--err' : '')}
            placeholder="Senha"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitGate()}
          />
          {gateError && <div className="mt-2 text-xs font-semibold text-bad">{gateError}</div>}
          <Button variant="primary" size="lg" block className="mt-4" loading={submitting} onClick={submitGate}>
            Entrar
          </Button>
        </Card>
      </div>
    );
  }

  // ─── Painel ───
  const totalPages = resp?.totalPages ?? 1;
  return (
    <div className="mx-auto h-full max-w-[1100px] overflow-y-auto px-5 pb-12 pt-8 lg:px-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
            <Users className="text-primary" size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">Usuários</h1>
            <div className="text-[12.5px] text-faint">{resp ? `${resp.total} cadastrados` : '—'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="inline" />
          <Button variant="ghost" size="md" leftIcon={<LogOut size={18} />} onClick={logout}>
            Sair
          </Button>
        </div>
      </header>

      {/* filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="mv-input flex flex-1 items-center gap-2 !py-0">
          <Search size={17} className="text-faint" />
          <input
            className="h-11 w-full border-none bg-transparent text-[15px] text-ink outline-none"
            placeholder="Buscar por nome ou email…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
          />
        </div>
        <Button variant="primary" size="md" onClick={applySearch}>
          Buscar
        </Button>
        <div className="relative">
          <select
            className="mv-input !w-auto appearance-none pr-9"
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / página
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint" />
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Download size={18} />}
          disabled={selectionCount === 0 || exporting}
          loading={exporting}
          onClick={doExport}
        >
          Exportar{selectionCount > 0 ? ` (${selectionCount})` : ''}
        </Button>
      </div>

      {/* banner de seleção entre páginas */}
      {(resp?.totalPages ?? 1) > 1 && (allMatching || allCurrentSelected) && (
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-card border border-line bg-primary-soft px-4 py-2.5 text-center text-[13px] text-ink-2">
          {allMatching ? (
            <>
              <span>
                Todos os <strong>{resp?.total}</strong> usuários estão selecionados.
              </span>
              <button onClick={clearSelection} className="font-bold text-primary-dark hover:underline">
                Limpar seleção
              </button>
            </>
          ) : (
            <>
              <span>
                Os <strong>{pageIds.length}</strong> desta página estão selecionados.
              </span>
              <button onClick={() => setAllMatching(true)} className="font-bold text-primary-dark hover:underline">
                Selecionar todos os {resp?.total} (todas as páginas)
              </button>
            </>
          )}
        </div>
      )}

      {/* tabela */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allMatching || allCurrentSelected}
                    onChange={toggleCurrentPage}
                    style={{ accentColor: 'var(--mv-primary)' }}
                    className="h-4 w-4 cursor-pointer align-middle"
                    aria-label="Selecionar página"
                  />
                </th>
                {COLUMNS.map((c) => (
                  <th key={c.key} className="px-4 py-3 text-[11.5px] font-bold uppercase tracking-wide text-faint">
                    {c.sortable ? (
                      <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 transition hover:text-ink-2">
                        {c.label}
                        {sort === c.key &&
                          (order === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-4 py-12 text-center">
                    <Spinner size={26} />
                  </td>
                </tr>
              ) : resp && resp.data.length > 0 ? (
                resp.data.map((u: AdminUser) => (
                  <tr
                    key={u.id}
                    className={cn(
                      'border-b border-subtle transition last:border-0 hover:bg-surface-2',
                      (allMatching || selected.has(u.id)) && 'bg-primary-soft',
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allMatching || selected.has(u.id)}
                        disabled={allMatching}
                        onChange={() => toggleRow(u.id)}
                        style={{ accentColor: 'var(--mv-primary)' }}
                        className="h-4 w-4 cursor-pointer align-middle disabled:opacity-60"
                        aria-label={`Selecionar ${u.name}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-[14px] font-semibold text-ink">{u.name}</td>
                    <td className="px-4 py-3 text-[13.5px] text-ink-2">{u.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] text-muted">{fmt(u.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] text-muted">{fmt(u.lastCreate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-4 py-12 text-center text-sm text-faint">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* paginação */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-[13px] text-faint">
          Página {resp?.page ?? page} de {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            leftIcon={<ChevronLeft size={18} />}
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="md"
            rightIcon={<ChevronRight size={18} />}
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
