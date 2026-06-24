// Tipos de domínio — Minha Viagem Organizada

export type CategoryKey =
  | 'Aéreo'
  | 'Hospedagem'
  | 'Transporte'
  | 'Alimentação'
  | 'Passeios'
  | 'Compras'
  | 'Seguro'
  | 'Outros';

export type CoverKey = 'beach' | 'city' | 'mountain';

export type Theme = 'light' | 'dark';

export type TripStatus = 'active' | 'upcoming' | 'past';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  /** ISO date YYYY-MM-DD */
  startDate: string;
  /** ISO date YYYY-MM-DD */
  endDate: string;
  totalBudget: number;
  cover: CoverKey;
  /** dataURL de foto enviada pelo usuário (opcional) */
  coverImage?: string | null;
}

export interface Expense {
  id: string;
  tripId: string;
  /** chave estável da categoria (Category.key) */
  category: string;
  description: string;
  amount: number;
  /** ISO date YYYY-MM-DD */
  expenseDate: string;
}

// Admin — listagem de usuários
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string | null;
  lastLoginAt: string | null;
  lastCreate: string | null;
}
export interface AdminUsersResponse {
  data: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Cotação de moeda (vs BRL)
export interface CurrencyRate {
  code: string;
  name: string;
  /** R$ por 1 unidade */
  rate: number;
  /** variação % do dia (string da API) */
  pctChange?: string | null;
  fetchedAt: string;
}

// Categoria de despesa (Perfil > Minhas Categorias)
export interface Category {
  id: string;
  /** chave estável usada por Expense.category */
  key: string;
  name: string;
  /** nome do ícone (lucide) */
  icon: string;
  color: string;
  isDefault: boolean;
  position: number;
}

export interface CategorySpend {
  /** chave da categoria */
  category: string;
  name: string;
  amount: number;
  color: string;
}

export interface DaySpend {
  date: string;
  amount: number;
  label: string;
}

export interface TripSummary {
  totalBudget: number;
  totalSpent: number;
  balance: number;
  dailyAverage: number;
  daysRemaining: number;
  duration: number;
  status: TripStatus;
  pct: number;
  spendingByCategory: CategorySpend[];
  spendingByDay: DaySpend[];
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'delete';
}

export type TripInput = Omit<Trip, 'id' | 'userId'>;
export type ExpenseInput = Omit<Expense, 'id'>;

export interface ChecklistTask {
  id: string;
  checklistId: string;
  text: string;
  responsible?: string | null;
  done: boolean;
  isDefault: boolean;
  position: number;
}

export interface Checklist {
  id: string;
  tripId: string;
  title: string;
  isDefault: boolean;
  hidden: boolean;
  position: number;
  tasks: ChecklistTask[];
}

// Modelos globais (Perfil > Meu Checklist) — sem estado de "feito".
export interface GlobalChecklistItem {
  id: string;
  checklistId: string;
  text: string;
  responsible?: string | null;
  position: number;
}

export interface GlobalChecklist {
  id: string;
  title: string;
  isDefault: boolean;
  /** se entra automaticamente em novas viagens */
  enabled: boolean;
  position: number;
  items: GlobalChecklistItem[];
}
