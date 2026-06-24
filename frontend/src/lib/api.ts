// Cliente HTTP do backend.
// O frontend é servido na mesma origem do backend (o nginx faz proxy de
// /auth /trips /expenses /health → backend:4000), então usamos caminhos
// relativos + cookies (credentials: 'include') para a sessão JWT.

import type {
  Trip,
  Expense,
  TripInput,
  ExpenseInput,
  User,
  Checklist,
  ChecklistTask,
  GlobalChecklist,
  GlobalChecklistItem,
  Category,
  CurrencyRate,
  AdminUsersResponse,
} from '../types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // ── auth ──
  me: () => req<User>('GET', '/auth/me'),
  logout: () => req<{ ok: boolean }>('POST', '/auth/logout'),

  // ── trips ──
  listTrips: () => req<Trip[]>('GET', '/api/trips'),
  createTrip: (data: TripInput) => req<Trip>('POST', '/api/trips', data),
  updateTrip: (id: string, data: Partial<TripInput>) => req<Trip>('PUT', `/api/trips/${id}`, data),
  deleteTrip: (id: string) => req<void>('DELETE', `/api/trips/${id}`),

  // ── expenses ──
  listExpenses: (tripId: string) => req<Expense[]>('GET', `/api/trips/${tripId}/expenses`),
  addExpense: (tripId: string, data: Omit<ExpenseInput, 'tripId'>) =>
    req<Expense>('POST', `/api/trips/${tripId}/expenses`, data),
  updateExpense: (id: string, data: Partial<ExpenseInput>) =>
    req<Expense>('PUT', `/api/expenses/${id}`, data),
  deleteExpense: (id: string) => req<void>('DELETE', `/api/expenses/${id}`),

  // ── checklists ──
  listChecklists: (tripId: string) => req<Checklist[]>('GET', `/api/trips/${tripId}/checklists`),
  createChecklist: (tripId: string, title: string) =>
    req<Checklist>('POST', `/api/trips/${tripId}/checklists`, { title }),
  updateChecklist: (id: string, data: { title?: string; hidden?: boolean }) =>
    req<Checklist>('PUT', `/api/checklists/${id}`, data),
  deleteChecklist: (id: string) => req<void>('DELETE', `/api/checklists/${id}`),

  // ── checklist tasks ──
  addTask: (checklistId: string, data: { text: string; responsible?: string | null }) =>
    req<ChecklistTask>('POST', `/api/checklists/${checklistId}/tasks`, data),
  updateTask: (id: string, data: { text?: string; responsible?: string | null; done?: boolean }) =>
    req<ChecklistTask>('PUT', `/api/tasks/${id}`, data),
  deleteTask: (id: string) => req<void>('DELETE', `/api/tasks/${id}`),

  // ── global checklists (modelos do usuário — Perfil > Meu Checklist) ──
  listGlobalChecklists: () => req<GlobalChecklist[]>('GET', '/api/global-checklists'),
  createGlobalChecklist: (title: string) =>
    req<GlobalChecklist>('POST', '/api/global-checklists', { title }),
  updateGlobalChecklist: (id: string, data: { title?: string; enabled?: boolean }) =>
    req<GlobalChecklist>('PUT', `/api/global-checklists/${id}`, data),
  deleteGlobalChecklist: (id: string) => req<void>('DELETE', `/api/global-checklists/${id}`),
  addGlobalItem: (checklistId: string, data: { text: string; responsible?: string | null }) =>
    req<GlobalChecklistItem>('POST', `/api/global-checklists/${checklistId}/items`, data),
  updateGlobalItem: (id: string, data: { text?: string; responsible?: string | null }) =>
    req<GlobalChecklistItem>('PUT', `/api/global-items/${id}`, data),
  deleteGlobalItem: (id: string) => req<void>('DELETE', `/api/global-items/${id}`),

  // ── categorias (Perfil > Minhas Categorias) ──
  listCategories: () => req<Category[]>('GET', '/api/categories'),
  createCategory: (data: { name: string; icon: string; color: string }) =>
    req<Category>('POST', '/api/categories', data),
  updateCategory: (id: string, data: { name?: string; icon?: string; color?: string }) =>
    req<Category>('PUT', `/api/categories/${id}`, data),
  deleteCategory: (id: string) => req<void>('DELETE', `/api/categories/${id}`),

  // ── cotações ──
  getRates: () => req<CurrencyRate[]>('GET', '/api/rates'),

  // ── admin ──
  adminLogin: (password: string) => req<{ ok: boolean }>('POST', '/api/admin/login', { password }),
  adminMe: () => req<{ ok: boolean }>('GET', '/api/admin/me'),
  adminLogout: () => req<{ ok: boolean }>('POST', '/api/admin/logout'),
  adminUsers: (params: { page: number; pageSize: number; q: string; sort: string; order: string }) => {
    const qs = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      q: params.q,
      sort: params.sort,
      order: params.order,
    }).toString();
    return req<AdminUsersResponse>('GET', `/api/admin/users?${qs}`);
  },
};
