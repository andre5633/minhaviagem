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
  category: CategoryKey;
  description: string;
  amount: number;
  /** ISO date YYYY-MM-DD */
  expenseDate: string;
}

export interface CategorySpend {
  category: CategoryKey;
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
