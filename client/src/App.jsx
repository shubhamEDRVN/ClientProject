import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScoreProvider } from './context/ScoreContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/DashboardNew';
import OverheadCalculator from './pages/OverheadCalculator';
import PricingMatrix from './pages/PricingMatrix';
import JobCosting from './pages/JobCosting';
import Learn from './pages/Learn';
import Scorecard from './pages/Scorecard';
import AdminLearn from './pages/AdminLearn';

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function AuthPages() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  // If user is logged in, don't show navbar for auth pages
  return isAuthenticated ? null : <Navbar />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/register"
            element={
              <>
                <AuthPages />
                <Register />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <AuthPages />
                <Login />
              </>
            }
          />
          {/* Protected app routes with sidebar layout */}
          <Route
            element={
              <ProtectedRoute>
                <ScoreProvider>
                  <AppLayout />
                </ScoreProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/overhead-calculator" element={<OverheadCalculator />} />
            <Route path="/pricing-matrix" element={<PricingMatrix />} />
            <Route path="/job-costing" element={<JobCosting />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/scorecard" element={<Scorecard />} />
            <Route path="/admin/learn" element={<AdminRoute><AdminLearn /></AdminRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
