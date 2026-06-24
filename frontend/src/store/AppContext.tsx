import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Trip, Expense, User, Theme, Toast, TripInput, ExpenseInput, Category } from '../types';
import { api, ApiError } from '../lib/api';
import { resolveIcon } from '../lib/categoryIcons';

export interface ResolvedCategory extends Category {
  Icon: LucideIcon;
}

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
  authLoading: boolean;
  login: () => void;
  logout: () => void;
  // dados
  trips: Trip[];
  expenses: Expense[];
  createTrip: (data: TripInput) => Promise<Trip>;
  updateTrip: (id: string, data: Partial<TripInput>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addExpense: (data: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, data: Partial<ExpenseInput>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  // categorias
  categories: Category[];
  categoryMap: Record<string, ResolvedCategory>;
  createCategory: (data: { name: string; icon: string; color: string }) => Promise<Category>;
  updateCategory: (id: string, data: { name?: string; icon?: string; color?: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
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

// Usuário "vazio" enquanto a sessão carrega. As telas que mostram o usuário
// ficam atrás do ProtectedRoute, então só renderizam com o usuário real carregado.
const BLANK_USER: User = { id: '', name: '', email: '', avatarUrl: '' };

function readTheme(): Theme {
  if (typeof document !== 'undefined') {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
  }
  return 'light';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(BLANK_USER);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: Toast['type'] = 'success') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismissToast(id), 2600);
    },
    [dismissToast],
  );

  // Carrega categorias + viagens + despesas de todas elas
  const loadData = useCallback(async () => {
    const [list, cats] = await Promise.all([api.listTrips(), api.listCategories()]);
    setTrips(list);
    setCategories(cats);
    const expLists = await Promise.all(list.map((t) => api.listExpenses(t.id)));
    setExpenses(expLists.flat());
  }, []);

  const categoryMap = useMemo(() => {
    const m: Record<string, ResolvedCategory> = {};
    categories.forEach((c) => {
      m[c.key] = { ...c, Icon: resolveIcon(c.icon) };
    });
    return m;
  }, [categories]);

  // Verifica a sessão no boot
  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setUser(me);
        setIsAuthed(true);
        await loadData();
      } catch {
        setIsAuthed(false);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [loadData]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const login = useCallback(() => {
    // Fluxo OAuth do servidor — sai da SPA e volta autenticado em /trips
    window.location.href = '/auth/google';
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignora — limpamos o estado de qualquer forma */
    }
    setIsAuthed(false);
    setUser(BLANK_USER);
    setTrips([]);
    setExpenses([]);
    setCategories([]);
    window.location.href = '/login';
  }, []);

  const createTrip = useCallback(async (data: TripInput): Promise<Trip> => {
    const trip = await api.createTrip(data);
    setTrips((prev) => [trip, ...prev]);
    return trip;
  }, []);

  const updateTrip = useCallback(async (id: string, data: Partial<TripInput>) => {
    const trip = await api.updateTrip(id, data);
    setTrips((prev) => prev.map((t) => (t.id === id ? trip : t)));
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    await api.deleteTrip(id);
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setExpenses((prev) => prev.filter((e) => e.tripId !== id));
  }, []);

  const addExpense = useCallback(async (data: ExpenseInput) => {
    const { tripId, ...rest } = data;
    const expense = await api.addExpense(tripId, rest);
    setExpenses((prev) => [expense, ...prev]);
  }, []);

  const updateExpense = useCallback(async (id: string, data: Partial<ExpenseInput>) => {
    const expense = await api.updateExpense(id, data);
    setExpenses((prev) => prev.map((e) => (e.id === id ? expense : e)));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await api.deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const createCategory = useCallback(async (data: { name: string; icon: string; color: string }) => {
    const c = await api.createCategory(data);
    setCategories((prev) => [...prev, c]);
    return c;
  }, []);

  const updateCategory = useCallback(
    async (id: string, data: { name?: string; icon?: string; color?: string }) => {
      const c = await api.updateCategory(id, data);
      setCategories((prev) => prev.map((x) => (x.id === id ? c : x)));
    },
    [],
  );

  const deleteCategory = useCallback(async (id: string) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const openExpenseSheet = useCallback(
    (opts: { mode?: 'add' | 'edit'; tripId: string; expense?: Expense | null }) => {
      setSheet({ open: true, mode: opts.mode ?? 'add', tripId: opts.tripId, expense: opts.expense ?? null });
    },
    [],
  );
  const closeExpenseSheet = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  const value: AppContextValue = {
    user,
    isAuthed,
    authLoading,
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
    categories,
    categoryMap,
    createCategory,
    updateCategory,
    deleteCategory,
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

// re-export para handlers que queiram tratar erros de API
export { ApiError };
