import { useApp } from '../store/AppContext';

/** Autenticação (mock). Em produção, trocar por Google OAuth + JWT. */
export function useAuth() {
  const { user, isAuthed, login, logout } = useApp();
  return { user, isAuthed, login, logout };
}
