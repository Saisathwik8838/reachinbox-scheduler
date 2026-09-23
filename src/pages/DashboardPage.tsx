import React from 'react';
import { Header } from '../components/email/Header';
import { Outlet } from 'react-router-dom';

export function DashboardPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
