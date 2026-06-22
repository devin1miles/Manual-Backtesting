import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import TradeJournal from './pages/TradeJournal';
import Analytics from './pages/Analytics';

function OnboardingGuard() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.onboarding_completed) return <Navigate to="/dashboard" replace />;
  return <Onboarding />;
}

function PrivateLayout() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.onboarding_completed) return <Navigate to="/onboarding" replace />;
  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<OnboardingGuard />} />
        <Route element={<PrivateLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/journal" element={<TradeJournal />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
