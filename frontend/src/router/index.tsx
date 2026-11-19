import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/contexts/AuthContext';
import Login from '../features/auth/pages/Login';
import Dashboard from '../features/dashboard/Dashboard';
import { ROUTES } from '../shared/config/routes.config';
import { setupFetch401Interceptor } from '../utils/common/interceptor';
import Loader from '../shared/components/ui/Loader';

// Code-split the config pages (issue #46): each page becomes its own chunk
// so the initial login/dashboard bundle stays small.
const NetworkMapPage = lazy(() =>
  import('../features/config/pages/NetworkMapPage').then((m) => ({ default: m.default })),
);
const RulePage = lazy(() =>
  import('../features/config/pages/RulePage').then((m) => ({ default: m.default })),
);
const TypologyPage = lazy(() =>
  import('../features/config/pages/TypologyPage').then((m) => ({ default: m.default })),
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();

  useEffect(() => {
    setupFetch401Interceptor(async () => {
      navigate(ROUTES.LOGIN);
    });
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
        <span className="ml-2 text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<div />} />
        <Route
          path={ROUTES.NETWORK_MAP}
          element={
            <Suspense fallback={<Loader />}>
              <NetworkMapPage />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.RULE}
          element={
            <Suspense fallback={<Loader />}>
              <RulePage />
            </Suspense>
          }
        />
        <Route
          path={ROUTES.TYPOLOGY}
          element={
            <Suspense fallback={<Loader />}>
              <TypologyPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
};
