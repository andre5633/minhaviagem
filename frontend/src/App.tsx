import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { TripList } from './pages/TripList';
import { TripForm } from './pages/TripForm';
import { TripDashboard } from './pages/TripDashboard';
import { ExpenseList } from './pages/ExpenseList';
import { Profile } from './pages/Profile';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            {/* Fluxos em tela cheia (sem casca) */}
            <Route path="/trips/new" element={<TripForm />} />
            <Route path="/trips/:id/edit" element={<TripForm />} />

            {/* Área com sidebar / bottom tabs */}
            <Route element={<AppShell />}>
              <Route path="/trips" element={<TripList />} />
              <Route path="/trips/:id" element={<TripDashboard />} />
              <Route path="/trips/:id/expenses" element={<ExpenseList />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/trips" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
