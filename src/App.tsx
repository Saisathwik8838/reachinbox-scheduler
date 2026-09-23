import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RequireAuth, RequireGuest } from './components/email/AuthGuard';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';

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
                <Route path="/dashboard" element={<DashboardPage />}>
                  <Route
                    index
                    element={<Navigate to="/dashboard/scheduled" replace />}
                  />
                  <Route
                    path="scheduled"
                    element={
                      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-card">
                        <h2 className="text-xl font-bold text-gray-900">Scheduled Emails</h2>
                        <p className="text-sm text-gray-500 mt-1">Ready for Milestone 4 table implementation</p>
                      </div>
                    }
                  />
                  <Route
                    path="sent"
                    element={
                      <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-card">
                        <h2 className="text-xl font-bold text-gray-900">Sent Emails</h2>
                        <p className="text-sm text-gray-500 mt-1">Ready for Milestone 4 table implementation</p>
                      </div>
                    }
                  />
                </Route>
              </Route>

              {/* Root & Catch-all Fallbacks */}
              <Route path="/" element={<Navigate to="/dashboard/scheduled" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
