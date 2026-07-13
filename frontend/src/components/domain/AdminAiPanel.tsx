import { useCallback, useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown, Check, X } from 'lucide-react';
import { api } from '../../lib/api';
import type { AdminAiResponse, AdminAiUser } from '../../types';
import { Button } from '../ui/Button';
import { cn } from '../../lib/cn';

const usd = (v: number) => `US$ ${v.toFixed(2)}`;

/**
 * Admin > IA / WhatsApp — consumo e limite do agente por cliente.
 * enabled/caps em null significa "usa o padrão do sistema" (mostrado como "padrão").
 */
export function AdminAiPanel() {
  const [resp, setResp] = useState<AdminAiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResp(await api.adminAi({ page, pageSize, q }));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q]);

  useEffect(() => {
    void load();
  }, [load]);

  const applySearch = () => {
    setPage(1);
    setQ(qInput.trim());
  };

  const patch = async (
    u: AdminAiUser,
    data: { enabled?: boolean; monthlyMessageCap?: number | null; monthlyCostCapUsd?: number | null },
  ) => {
    setSaving(u.id);
    try {
      const saved = await api.adminAiUpdate(u.id, data);
      setResp((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((row) =>
                row.id === u.id
                  ? {
                      ...row,
                      enabled: saved.enabled,
                      monthlyMessageCap: saved.monthlyMessageCap,
                      monthlyCostCapUsd: saved.monthlyCostCapUsd,
                    }
                  : row,
              ),
            }
          : prev,
      );
    } finally {
      setSaving(null);
    }
  };

  const totalPages = resp?.totalPages ?? 1;
  const defaults = resp?.defaults;

  const mesTotal = (resp?.data ?? []).reduce((s, u) => s + u.monthCostUsd, 0);

  return (
    <>
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
      </div>

      {defaults && (
        <div className="mb-4 rounded-2xl bg-subtle px-4 py-3 text-[13px] leading-relaxed text-muted">
          Padrão do sistema: <b className="text-ink-2">{defaults.monthlyMessageCap} mensagens</b> e{' '}
          <b className="text-ink-2">{usd(defaults.monthlyCostCapUsd)}</b> por cliente/mês. Custo desta página no mês:{' '}
          <b className="text-ink-2">{usd(mesTotal)}</b>.
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-[12px] font-extrabold uppercase tracking-wide text-faint">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Mês (msgs / custo)</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Teto msgs</th>
              <th className="px-4 py-3">Teto US$</th>
              <th className="px-4 py-3">Agente</th>
            </tr>
          </thead>
          <tbody>
            {loading && !resp ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-faint">
                  Carregando…
                </td>
              </tr>
            ) : !resp?.data.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-faint">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : (
              resp.data.map((u) => {
                const ligado = u.enabled ?? true;
                return (
                  <tr key={u.id} className="border-b border-subtle last:border-0">
                    <td className="px-4 py-3">
                      <div className="text-[14px] font-bold text-ink">{u.name}</div>
                      <div className="text-[12px] text-faint">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {u.waConnected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-good-l px-2.5 py-1 text-[11.5px] font-bold text-good">
                          <Check size={13} /> conectado
                        </span>
                      ) : (
                        <span className="text-[12.5px] text-faint-2">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] text-ink-2">
                      {u.monthMessages} · <span className="font-bold">{usd(u.monthCostUsd)}</span>
                    </td>
                    <td className="px-4 py-3 text-[13.5px] text-muted">
                      {u.totalMessages} · {usd(u.totalCostUsd)}
                    </td>
                    <td className="px-4 py-3">
                      <CapInput
                        value={u.monthlyMessageCap}
                        placeholder={String(defaults?.monthlyMessageCap ?? '')}
                        disabled={saving === u.id}
                        onSave={(v) => patch(u, { monthlyMessageCap: v })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <CapInput
                        value={u.monthlyCostCapUsd}
                        placeholder={String(defaults?.monthlyCostCapUsd ?? '')}
                        decimal
                        disabled={saving === u.id}
                        onSave={(v) => patch(u, { monthlyCostCapUsd: v })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={saving === u.id}
                        onClick={() => patch(u, { enabled: !ligado })}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition',
                          ligado ? 'bg-good-l text-good hover:bg-good/20' : 'bg-bad-l text-bad hover:bg-bad/20',
                        )}
                      >
                        {ligado ? <Check size={14} /> : <X size={14} />}
                        {ligado ? 'ativo' : 'desligado'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
    </>
  );
}

/** Campo de teto: vazio = usa o padrão do sistema (envia null). Salva no blur/Enter. */
function CapInput({
  value,
  placeholder,
  decimal,
  disabled,
  onSave,
}: {
  value: number | null;
  placeholder: string;
  decimal?: boolean;
  disabled?: boolean;
  onSave: (v: number | null) => void;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));

  useEffect(() => {
    setText(value === null ? '' : String(value));
  }, [value]);

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed === '') {
      if (value !== null) onSave(null);
      return;
    }
    const n = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) {
      setText(value === null ? '' : String(value));
      return;
    }
    const next = decimal ? Math.round(n * 100) / 100 : Math.trunc(n);
    if (next !== value) onSave(next);
  };

  return (
    <input
      value={text}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="w-[86px] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13.5px] text-ink outline-none transition placeholder:text-faint-2 focus:border-primary disabled:opacity-50"
    />
  );
}
