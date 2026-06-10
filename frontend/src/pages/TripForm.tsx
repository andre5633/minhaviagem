import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Check, MapPin, Info } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TripCover } from '../components/domain/TripCover';
import { CoverPicker } from '../components/domain/CoverPicker';
import {
  currencyToNumber,
  numberToCurrencyInput,
  parseDate,
  daysBetween,
  formatDateFull,
  formatBRL,
} from '../lib/formatters';
import type { CoverKey } from '../types';

type Errors = Partial<Record<'title' | 'destination' | 'startDate' | 'endDate' | 'budget', string>>;

export function TripForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips, createTrip, updateTrip, toast } = useApp();
  const editing = id ? trips.find((t) => t.id === id) : undefined;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState(() => ({
    title: editing?.title ?? '',
    destination: editing?.destination ?? '',
    startDate: editing?.startDate ?? '',
    endDate: editing?.endDate ?? '',
    budgetStr: editing ? numberToCurrencyInput(editing.totalBudget) : '',
    cover: (editing?.cover ?? 'beach') as CoverKey,
    coverImage: editing?.coverImage ?? null,
  }));

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const budget = currencyToNumber(form.budgetStr);

  const errors = useMemo<Errors>(() => {
    const e: Errors = {};
    if (!form.title.trim()) e.title = 'Dê um nome para a viagem';
    if (!form.destination.trim()) e.destination = 'Informe o destino';
    if (!form.startDate) e.startDate = 'Selecione a data de ida';
    if (!form.endDate) e.endDate = 'Selecione a data de volta';
    if (form.startDate && form.endDate && parseDate(form.endDate) < parseDate(form.startDate))
      e.endDate = 'A volta não pode ser antes da ida';
    if (!budget) e.budget = 'Defina o orçamento total';
    return e;
  }, [form, budget]);

  const step1Valid = Object.keys(errors).length === 0;

  const goNext = () => {
    setTouched({ title: true, destination: true, startDate: true, endDate: true, budget: true });
    if (step1Valid) setStep(2);
  };

  const confirm = async () => {
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      destination: form.destination.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      totalBudget: budget,
      cover: form.cover,
      coverImage: form.coverImage,
    };
    try {
      if (editing) {
        await updateTrip(editing.id, payload);
        toast('Viagem atualizada');
        navigate(`/trips/${editing.id}`);
      } else {
        const t = await createTrip(payload);
        toast('Viagem criada!');
        navigate(`/trips/${t.id}`);
      }
    } catch (err) {
      setSaving(false);
      toast(err instanceof Error ? err.message : 'Erro ao salvar viagem', 'error');
    }
  };

  const field = (label: string, key: keyof Errors, node: ReactNode) => (
    <div className="mb-3.5">
      <label className="mv-label">{label}</label>
      {node}
      {touched[key] && errors[key] && (
        <span className="mt-1.5 flex items-center gap-1 pl-0.5 text-xs font-semibold text-bad">
          <Info size={13} /> {errors[key]}
        </span>
      )}
    </div>
  );

  const errClass = (key: keyof Errors) => 'mv-input' + (touched[key] && errors[key] ? ' mv-input--err' : '');

  return (
    <div className="flex h-full flex-col bg-bg">
      <header
        className="flex items-center justify-between border-b border-line px-3 pb-3 pt-12 backdrop-blur lg:px-6"
        style={{ background: 'var(--mv-glass)' }}
      >
        <button
          onClick={() => (step === 2 ? setStep(1) : navigate(-1))}
          aria-label="Voltar"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-3 transition hover:bg-subtle active:scale-90"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-[17px] font-bold text-ink">{editing ? 'Editar viagem' : 'Nova viagem'}</h1>
        <div className="w-10" />
      </header>

      {/* stepper */}
      <div className="mx-auto flex w-full max-w-md items-center gap-1 px-7 py-3.5">
        {[1, 2].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-2 last:flex-initial">
            <div className="flex items-center gap-2">
              <div
                className={
                  'flex h-7 w-7 items-center justify-center rounded-full text-[13.5px] font-extrabold transition ' +
                  (step > n
                    ? 'bg-ok text-white'
                    : step === n
                      ? 'bg-primary text-white shadow-[0_6px_14px_-4px_var(--mv-primary)]'
                      : 'bg-line-2 text-faint')
                }
              >
                {step > n ? <Check size={15} /> : n}
              </div>
              <span className={'text-[13px] font-bold ' + (step >= n ? 'text-ink' : 'text-faint')}>
                {n === 1 ? 'Detalhes' : 'Resumo'}
              </span>
            </div>
            {n === 1 && <div className={'h-[2.5px] flex-1 rounded-full ' + (step > 1 ? 'bg-ok' : 'bg-line-2')} />}
          </div>
        ))}
      </div>

      <main className="mv-scroll flex-1 overflow-y-auto px-5 pb-28 lg:px-0">
        <div className="mx-auto w-full max-w-xl lg:pt-2">
          {step === 1 ? (
            <Card className="p-5 lg:p-6">
              {field(
                'Título da viagem',
                'title',
                <input
                  className={errClass('title')}
                  value={form.title}
                  placeholder="Ex: Verão em Floripa"
                  onChange={(e) => set('title', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                />,
              )}
              {field(
                'Destino',
                'destination',
                <div className="mv-input flex items-center gap-2.5 !px-3.5">
                  <MapPin size={18} className="text-faint" />
                  <input
                    className="w-full border-none bg-transparent text-[15px] font-medium text-ink outline-none"
                    value={form.destination}
                    placeholder="Cidade, País"
                    onChange={(e) => set('destination', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, destination: true }))}
                  />
                </div>,
              )}
              <div className="flex flex-col gap-0 sm:flex-row sm:gap-3">
                <div className="flex-1">
                  {field(
                    'Ida',
                    'startDate',
                    <input
                      type="date"
                      className={errClass('startDate')}
                      value={form.startDate}
                      onChange={(e) => set('startDate', e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, startDate: true }))}
                    />,
                  )}
                </div>
                <div className="flex-1">
                  {field(
                    'Volta',
                    'endDate',
                    <input
                      type="date"
                      className={errClass('endDate')}
                      value={form.endDate}
                      min={form.startDate || undefined}
                      onChange={(e) => set('endDate', e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, endDate: true }))}
                    />,
                  )}
                </div>
              </div>
              {field(
                'Orçamento total',
                'budget',
                <div className="mv-input flex items-center gap-2 !px-3.5">
                  <span className="text-[15px] font-bold text-faint">R$</span>
                  <input
                    className="w-full border-none bg-transparent text-[15px] font-medium text-ink outline-none"
                    inputMode="numeric"
                    value={form.budgetStr}
                    placeholder="0,00"
                    onChange={(e) => set('budgetStr', numberToCurrencyInput(currencyToNumber(e.target.value)))}
                    onBlur={() => setTouched((t) => ({ ...t, budget: true }))}
                  />
                </div>,
              )}
              <div>
                <label className="mv-label">Capa</label>
                <CoverPicker
                  value={form.cover}
                  image={form.coverImage}
                  onChange={(v) => setForm((f) => ({ ...f, ...v }))}
                />
              </div>
              <div className="mt-5 flex justify-end">
                <Button variant="primary" size="lg" rightIcon={<ChevronRight size={20} />} onClick={goNext}>
                  Continuar
                </Button>
              </div>
            </Card>
          ) : (
            <div>
              <div className="mb-4 overflow-hidden rounded-card">
                <TripCover cover={form.cover} image={form.coverImage} height={120} />
              </div>
              <Card className="p-2">
                {(
                  [
                    ['Título', form.title],
                    ['Destino', form.destination],
                    ['Ida', formatDateFull(form.startDate)],
                    ['Volta', formatDateFull(form.endDate)],
                    ['Duração', `${daysBetween(form.startDate, form.endDate) + 1} dias`],
                    ['Orçamento', formatBRL(budget)],
                  ] as const
                ).map(([k, v], i, arr) => (
                  <div
                    key={k}
                    className={
                      'flex items-center justify-between px-3.5 py-3.5 ' +
                      (i < arr.length - 1 ? 'border-b border-subtle' : '')
                    }
                  >
                    <span className="text-[13.5px] font-semibold text-faint">{k}</span>
                    <span className="max-w-[62%] text-right text-[14.5px] font-bold text-ink">{v}</span>
                  </div>
                ))}
              </Card>
              <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-primary-soft px-3.5 py-3 text-[12.5px] leading-snug text-muted">
                <Info size={15} className="mt-0.5 flex-shrink-0 text-primary" />
                Confira os dados antes de confirmar. Você pode editar depois.
              </div>
              <div className="mt-5 flex gap-3">
                <Button variant="ghost" size="lg" leftIcon={<ArrowLeft size={20} />} onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button variant="primary" size="lg" block loading={saving} onClick={confirm}>
                  {editing ? 'Salvar alterações' : 'Confirmar viagem'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
