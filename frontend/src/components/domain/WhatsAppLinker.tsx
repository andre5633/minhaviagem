import { useEffect, useState } from 'react';
import { MessageCircle, Check, Copy, Unlink, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import type { WhatsAppLink } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';

/** Perfil > WhatsApp — conecta o número do usuário ao assistente. */
export function WhatsAppLinker() {
  const [link, setLink] = useState<WhatsAppLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  const load = async () => {
    const data = await api.getWhatsAppLink();
    setLink(data);
    setPhone(data.phone ?? '');
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      await api.createWhatsAppCode(phone.trim() || undefined);
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const unlink = async () => {
    await api.unlinkWhatsApp();
    setConfirmUnlink(false);
    await load();
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) return <Card className="p-6 text-sm text-faint">Carregando…</Card>;
  if (!link) return null;

  if (!link.configured) {
    return (
      <Card className="p-6">
        <div className="text-[15px] font-bold text-ink">Assistente no WhatsApp</div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          O assistente ainda não está disponível nesta instalação.
        </p>
      </Card>
    );
  }

  // ── já conectado
  if (link.connected) {
    return (
      <>
        <Card className="p-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-good-l text-good">
              <Check size={22} strokeWidth={2.6} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-ink">WhatsApp conectado</div>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Você já pode conversar com o assistente. Pergunte sobre orçamento, saldo, gastos e checklist — ou mande
                uma despesa, tipo “gastei 80 no almoço”.
              </p>
              {link.verifiedAt && (
                <div className="mt-2 text-xs text-faint-2">
                  Conectado em {new Date(link.verifiedAt).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </div>

          <Button
            variant="danger"
            size="md"
            leftIcon={<Unlink size={17} />}
            onClick={() => setConfirmUnlink(true)}
            className="mt-5"
          >
            Desconectar
          </Button>
        </Card>

        <ConfirmDialog
          open={confirmUnlink}
          title="Desconectar o WhatsApp?"
          body="O assistente vai parar de responder neste número. Você pode conectar de novo quando quiser."
          confirmLabel="Desconectar"
          danger
          onConfirm={unlink}
          onCancel={() => setConfirmUnlink(false)}
        />
      </>
    );
  }

  // ── ainda não conectado
  const codeAtivo = Boolean(link.code);

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-dark">
          <MessageCircle size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-ink">Assistente no WhatsApp</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Consulte suas viagens e lance despesas conversando no WhatsApp. Gere o código abaixo e envie para o nosso
            número — é assim que sabemos que o número é seu.
          </p>
        </div>
      </div>

      {!codeAtivo ? (
        <div className="mt-5">
          <label className="mb-1.5 block text-[13px] font-bold text-ink-3">Seu número (opcional)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 98765-4321"
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-primary"
          />
          <Button size="lg" block loading={generating} onClick={generate} className="mt-3.5">
            Gerar código de conexão
          </Button>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-subtle p-5">
          <div className="text-[13px] font-bold text-ink-3">1. Envie este código no WhatsApp</div>
          <button
            onClick={() => copy(link.code!)}
            className="mt-2 flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 transition hover:bg-surface-2"
          >
            <span className="font-mono text-[26px] font-extrabold tracking-[0.3em] text-ink">{link.code}</span>
            {copied ? <Check size={18} className="text-good" /> : <Copy size={18} className="text-faint" />}
          </button>

          <div className="mt-4 text-[13px] font-bold text-ink-3">2. Para o número</div>
          <button
            onClick={() => copy(link.displayNumber)}
            className="mt-2 flex w-full items-center justify-between rounded-xl bg-surface px-4 py-3 transition hover:bg-surface-2"
          >
            <span className="text-[16px] font-bold text-ink">{link.displayNumber || '—'}</span>
            <Copy size={18} className="text-faint" />
          </button>

          {link.codeExpiresAt && (
            <div className="mt-3.5 text-xs text-faint-2">
              O código vale até {new Date(link.codeExpiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
            </div>
          )}

          <Button
            variant="ghost"
            size="md"
            leftIcon={<RefreshCw size={16} />}
            loading={generating}
            onClick={generate}
            className="mt-3"
          >
            Gerar outro código
          </Button>
        </div>
      )}
    </Card>
  );
}
