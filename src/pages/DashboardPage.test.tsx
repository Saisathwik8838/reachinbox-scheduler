import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './DashboardPage';
import { AuthProvider } from '../context/AuthContext';

describe('DashboardPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock auth/me
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            user: { id: '1', name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com' },
          }),
        } as unknown as Response);
      }

      if (url.includes('/api/emails/scheduled')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 'sched-1',
                recipient: 'maya.chen@northwind.co',
                subject: 'Welcome to our platform',
                status: 'scheduled',
                scheduledAt: '2026-09-23T16:30:00.000Z',
                sentAt: null,
                lastError: null,
                previewUrl: null,
              },
            ],
            page: 1,
            pageSize: 10,
            total: 42,
          }),
        } as unknown as Response);
      }

      if (url.includes('/api/emails/sent')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 'sent-1',
                recipient: 'ines.duarte@vela.pt',
                subject: 'Welcome to our platform',
                status: 'failed',
                scheduledAt: '2026-09-23T10:30:00.000Z',
                sentAt: '2026-09-23T10:30:10.000Z',
                lastError: '550 Mailbox unavailable',
                previewUrl: null,
              },
            ],
            page: 1,
            pageSize: 10,
            total: 318,
          }),
        } as unknown as Response);
      }

      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  it('renders Scheduled view by default with header, tabs, and scheduled email rows', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard/scheduled']}>
            <DashboardPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: /emails/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /compose new email/i })).toBeInTheDocument();

    // Verify scheduled item rendered
    expect(await screen.findByText('maya.chen@northwind.co')).toBeInTheDocument();
    expect(screen.getByText('Welcome to our platform')).toBeInTheDocument();
    expect(screen.getAllByText('Scheduled').length).toBeGreaterThan(0);
  });

  it('renders Sent view with delivery error reason when on /dashboard/sent route', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard/sent']}>
            <DashboardPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(await screen.findByText('ines.duarte@vela.pt')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('550 Mailbox unavailable')).toBeInTheDocument();
  });

  it('dispatches open-compose-modal event when Compose button is clicked', async () => {
    const eventSpy = vi.fn();
    window.addEventListener('open-compose-modal', eventSpy);

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/dashboard/scheduled']}>
            <DashboardPage />
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    const composeBtn = screen.getByRole('button', { name: /compose new email/i });
    await userEvent.click(composeBtn);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    window.removeEventListener('open-compose-modal', eventSpy);
  });
});
