import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { TripList } from './pages/TripList';
import { TripForm } from './pages/TripForm';
import { TripDashboard } from './pages/TripDashboard';
import { ExpenseList } from './pages/ExpenseList';
import { ChecklistPage } from './pages/ChecklistPage';
import { Profile } from './pages/Profile';
import { AdminPage } from './pages/AdminPage';

// Subdomínio admin.* (ex.: admin.novodominio) abre direto a área administrativa
const isAdminHost = typeof window !== 'undefined' && /^admin\./i.test(window.location.hostname);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPage />} />

          <Route element={<ProtectedRoute />}>
            {/* Fluxos em tela cheia (sem casca) */}
            <Route path="/trips/new" element={<TripForm />} />
            <Route path="/trips/:id/edit" element={<TripForm />} />

            {/* Área com sidebar / bottom tabs */}
            <Route element={<AppShell />}>
              <Route path="/trips" element={<TripList />} />
              <Route path="/trips/:id" element={<TripDashboard />} />
              <Route path="/trips/:id/expenses" element={<ExpenseList />} />
              <Route path="/trips/:id/checklist" element={<ChecklistPage />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={isAdminHost ? '/admin' : '/trips'} replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
