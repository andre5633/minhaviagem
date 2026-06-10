import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { Spinner } from '../ui/Spinner';

/** Bloqueia rotas internas quando não autenticado. */
export function ProtectedRoute() {
  const { isAuthed, authLoading } = useApp();

  // Enquanto a sessão (/auth/me) está sendo verificada, não decide nada —
  // evita expulsar o usuário logado para /login num F5.
  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Outlet />;
}
