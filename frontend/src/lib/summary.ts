import type { Trip, Expense, TripSummary, TripStatus, CategorySpend, DaySpend } from '../types';
import { CATEGORIES } from './categories';
import { parseDate, today, daysBetween, toISO } from './formatters';

export function tripStatus(trip: Trip, ref: Date = today()): TripStatus {
  const s = parseDate(trip.startDate);
  const e = parseDate(trip.endDate);
  if (ref < s) return 'upcoming';
  if (ref > e) return 'past';
  return 'active';
}

export function tripDuration(trip: Trip): number {
  return daysBetween(trip.startDate, trip.endDate) + 1;
}

export function daysRemaining(trip: Trip, ref: Date = today()): number {
  const s = parseDate(trip.startDate);
  const e = parseDate(trip.endDate);
  if (ref < s) return daysBetween(ref, s); // dias até começar
  if (ref > e) return 0;
  return Math.max(0, daysBetween(ref, e));
}

/** Equivalente a GET /trips/:id/summary, calculado no cliente */
export function computeSummary(trip: Trip, expenses: Expense[]): TripSummary {
  const ref = today();
  const tripExp = expenses.filter((e) => e.tripId === trip.id);

  const totalSpent = tripExp.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = trip.totalBudget;
  const balance = totalBudget - totalSpent;

  const status = tripStatus(trip, ref);
  const duration = tripDuration(trip);

  let elapsed: number;
  if (status === 'upcoming') elapsed = 1;
  else if (status === 'past') elapsed = duration;
  else elapsed = Math.max(1, daysBetween(trip.startDate, ref) + 1);

  const dailyAverage = totalSpent / elapsed;

  // por categoria
  const byCat: Partial<Record<string, number>> = {};
  tripExp.forEach((e) => {
    byCat[e.category] = (byCat[e.category] || 0) + e.amount;
  });
  const spendingByCategory: CategorySpend[] = CATEGORIES.filter((c) => byCat[c.key])
    .map((c) => ({ category: c.key, amount: byCat[c.key] as number, color: c.color }))
    .sort((a, b) => b.amount - a.amount);

  // por dia (cada dia da viagem)
  const byDay: Partial<Record<string, number>> = {};
  tripExp.forEach((e) => {
    byDay[e.expenseDate] = (byDay[e.expenseDate] || 0) + e.amount;
  });
  const spendingByDay: DaySpend[] = [];
  const start = parseDate(trip.startDate);
  for (let i = 0; i < duration; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = toISO(d);
    spendingByDay.push({ date: iso, amount: byDay[iso] || 0, label: `${d.getDate()}/${d.getMonth() + 1}` });
  }

  return {
    totalBudget,
    totalSpent,
    balance,
    dailyAverage,
    daysRemaining: daysRemaining(trip, ref),
    duration,
    status,
    pct: totalBudget ? Math.min(999, Math.round((totalSpent / totalBudget) * 100)) : 0,
    spendingByCategory,
    spendingByDay,
  };
}

let _idCounter = 0;
export function uid(prefix: string): string {
  _idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${_idCounter}`;
}
