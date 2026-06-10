// Formatadores e helpers de data (pt-BR / BRL)

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const NBSP = '\u00A0';

/** Converte 'YYYY-MM-DD' (ou Date) para Date local ao meio-dia (evita timezone shift) */
export function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function toISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Hoje, normalizado ao meio-dia */
export function today(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

export function todayISO(): string {
  return toISO(today());
}

export function formatBRL(n: number): string {
  return `R$${NBSP}${Number(n || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatBRLShort(n: number): string {
  return `R$${NBSP}${Number(n || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(value: string): string {
  const d = parseDate(value);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function formatDateFull(value: string): string {
  const d = parseDate(value);
  return `${d.getDate()} de ${MESES_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

export function formatDayHeader(value: string): string {
  const d = parseDate(value);
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function formatRange(a: string, b: string): string {
  const da = parseDate(a);
  const db = parseDate(b);
  const sameMonth = da.getMonth() === db.getMonth() && da.getFullYear() === db.getFullYear();
  if (sameMonth) return `${da.getDate()} – ${db.getDate()} ${MESES[db.getMonth()]} ${db.getFullYear()}`;
  return `${da.getDate()} ${MESES[da.getMonth()]} – ${db.getDate()} ${MESES[db.getMonth()]} ${db.getFullYear()}`;
}

export function daysBetween(a: string | Date, b: string | Date): number {
  const ms = parseDate(b).getTime() - parseDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Máscara de moeda: dígitos → "1.234,56" */
export function currencyToNumber(str: string): number {
  const digits = (str || '').replace(/\D/g, '');
  return digits ? Number(digits) / 100 : 0;
}

export function numberToCurrencyInput(n: number): string {
  if (!n) return '';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
