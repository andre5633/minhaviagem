import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Trip, Expense, User, Theme, Toast, TripInput, ExpenseInput } from '../types';
import { MOCK_USER, MOCK_TRIPS, MOCK_EXPENSES } from '../data/mockData';
import { uid } from '../lib/summary';

export interface ExpenseSheetState {
  open: boolean;
  mode: 'add' | 'edit';
  tripId: string | null;
  expense: Expense | null;
}

interface AppContextValue {
  // auth
  user: User;
  isAuthed: boolean;
  login: () => void;
  logout: () => void;
  // dados
  trips: Trip[];
  expenses: Expense[];
  createTrip: (data: TripInput) => Trip;
  updateTrip: (id: string, data: Partial<TripInput>) => void;
  deleteTrip: (id: string) => void;
  addExpense: (data: ExpenseInput) => void;
  updateExpense: (id: string, data: Partial<ExpenseInput>) => void;
  deleteExpense: (id: string) => void;
  // tema
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  // toasts
  toasts: Toast[];
  toast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
  // sheet de despesa
  sheet: ExpenseSheetState;
  openExpenseSheet: (opts: { mode?: 'add' | 'edit'; tripId: string; expense?: Expense | null }) => void;
  closeExpenseSheet: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function readTheme(): Theme {
  if (typeof document !== 'undefined') {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
  }
  return 'light';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [theme, setThemeState] = useState<Theme>(readTheme);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sheet, setSheet] = useState<ExpenseSheetState>({
    open: false,
    mode: 'add',
    tripId: null,
    expense: null,
  });

  // tema → <html data-theme> + localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('mv-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const login = useCallback(() => setIsAuthed(true), []);
  const logout = useCallback(() => setIsAuthed(false), []);

  const createTrip = useCallback((data: TripInput): Trip => {
    const trip: Trip = { id: uid('t'), userId: MOCK_USER.id, ...data };
    setTrips((prev) => [...prev, trip]);
    return trip;
  }, []);

  const updateTrip = useCallback((id: string, data: Partial<TripInput>) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setExpenses((prev) => prev.filter((e) => e.tripId !== id));
  }, []);

  const addExpense = useCallback((data: ExpenseInput) => {
    setExpenses((prev) => [...prev, { id: uid('e'), ...data }]);
  }, []);

  const updateExpense = useCallback((id: string, data: Partial<ExpenseInput>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: Toast['type'] = 'success') => {
      const id = uid('toast');
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismissToast(id), 2600);
    },
    [dismissToast],
  );

  const openExpenseSheet = useCallback(
    (opts: { mode?: 'add' | 'edit'; tripId: string; expense?: Expense | null }) => {
      setSheet({ open: true, mode: opts.mode ?? 'add', tripId: opts.tripId, expense: opts.expense ?? null });
    },
    [],
  );
  const closeExpenseSheet = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  const value: AppContextValue = {
    user: MOCK_USER,
    isAuthed,
    login,
    logout,
    trips,
    expenses,
    createTrip,
    updateTrip,
    deleteTrip,
    addExpense,
    updateExpense,
    deleteExpense,
    theme,
    setTheme,
    toggleTheme,
    toasts,
    toast,
    dismissToast,
    sheet,
    openExpenseSheet,
    closeExpenseSheet,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>');
  return ctx;
}
