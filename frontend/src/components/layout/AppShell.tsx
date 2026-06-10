import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { ToastStack } from '../ui/ToastStack';
import { OverlaySheet } from '../ui/OverlaySheet';
import { ExpenseForm } from '../domain/ExpenseForm';
import { useApp } from '../../store/AppContext';

/**
 * Casca responsiva:
 * - lg+: Sidebar à esquerda + conteúdo
 * - mobile: conteúdo + BottomTabBar
 * Renderiza o overlay de despesa (sheet/modal) e os toasts.
 */
export function AppShell() {
  const { sheet, closeExpenseSheet } = useApp();
  const location = useLocation();

  return (
    <div className="relative flex h-full overflow-hidden bg-bg">
      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <main key={location.pathname} className="mv-scroll mv-anim-screen flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <BottomTabBar />
      </div>

      <OverlaySheet
        open={sheet.open}
        onClose={closeExpenseSheet}
        title={sheet.mode === 'edit' ? 'Editar despesa' : 'Lançar despesa'}
      >
        <ExpenseForm />
      </OverlaySheet>

      <ToastStack />
    </div>
  );
}
