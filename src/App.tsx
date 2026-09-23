import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/scheduled" replace />} />
          <Route
            path="/login"
            element={
              <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 shadow-card border border-surface-border text-center max-w-md w-full">
                  <h1 className="text-xl font-semibold text-gray-900">ReachInbox Scheduler</h1>
                  <p className="text-sm text-gray-500 mt-2">Scaffold initialized successfully</p>
                </div>
              </div>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <div className="min-h-screen p-8">
                <div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow-card border border-surface-border">
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Scaffold</h1>
                  <p className="text-gray-500 mt-2">Ready for Milestone 2 UI Primitives</p>
                </div>
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
