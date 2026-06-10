import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '../../store/AppContext';

/** Bloqueia rotas internas quando não autenticado. */
export function ProtectedRoute() {
  const { isAuthed } = useApp();
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <Outlet />;
}
