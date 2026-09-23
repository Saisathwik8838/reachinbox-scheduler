import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('App Route Guard & Shell Test', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders login page when unauthenticated', async () => {
    // Mock /api/auth/me returning 401
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'No session' } }),
    } as unknown as Response);

    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /schedule and manage your emails/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });
  });

  it('renders dashboard shell and header when authenticated', async () => {
    // Mock /api/auth/me returning user
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: 'user_1',
          name: 'Aarav Sharma',
          email: 'aarav.sharma@gmail.com',
          avatarUrl: null,
        },
      }),
    } as unknown as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
      expect(screen.getByText('aarav.sharma@gmail.com')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
      expect(screen.getByText(/scheduled emails/i)).toBeInTheDocument();
    });
  });
});
