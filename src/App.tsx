import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { RequireAuth, RequireGuest } from './components/email/AuthGuard';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Guest Routes */}
                <Route element={<RequireGuest />}>
                  <Route path="/login" element={<LoginPage />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<RequireAuth />}>
                  <Route
                    path="/dashboard"
                    element={<Navigate to="/dashboard/scheduled" replace />}
                  />
                  <Route path="/dashboard/scheduled" element={<DashboardPage />} />
                  <Route path="/dashboard/sent" element={<DashboardPage />} />
                </Route>

                {/* Root & Catch-all Fallbacks */}
                <Route path="/" element={<Navigate to="/dashboard/scheduled" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
