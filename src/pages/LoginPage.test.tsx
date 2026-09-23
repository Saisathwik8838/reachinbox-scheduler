import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders sign-in header, brand mark, and Google OAuth button', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('ReachInbox')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /schedule and manage your emails/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('displays error alert when ?error=consent_denied is in the query params', () => {
    render(
      <MemoryRouter initialEntries={['/login?error=consent_denied']}>
        <LoginPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/google oauth permission was denied/i)
    ).toBeInTheDocument();
  });

  it('disables button and triggers browser redirect when Google button is clicked', async () => {
    const originalLocation = window.location;
    const locationMock = { ...originalLocation, href: '' };

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: locationMock,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /continue with google/i });
    await userEvent.click(button);

    expect(locationMock.href).toBe('/api/auth/google');
    expect(screen.getByText(/connecting to google/i)).toBeInTheDocument();

    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: originalLocation,
    });
  });
});
