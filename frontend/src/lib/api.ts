// Cliente HTTP do backend.
// O frontend é servido na mesma origem do backend (o nginx faz proxy de
// /auth /trips /expenses /health → backend:4000), então usamos caminhos
// relativos + cookies (credentials: 'include') para a sessão JWT.

import type { Trip, Expense, TripInput, ExpenseInput, User } from '../types';

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
};
