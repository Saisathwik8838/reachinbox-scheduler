import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders Scheduled status badge', () => {
    render(<StatusBadge status="scheduled" />);
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('renders Sending status badge', () => {
    render(<StatusBadge status="sending" />);
    expect(screen.getByText('Sending')).toBeInTheDocument();
  });

  it('renders Rescheduled badge with hourly limit subtext', () => {
    render(<StatusBadge status="rescheduled" />);
    expect(screen.getByText('Rescheduled')).toBeInTheDocument();
    expect(screen.getByText('Hourly limit reached')).toBeInTheDocument();
  });

  it('renders Sent badge with external Ethereal preview link', () => {
    render(
      <StatusBadge
        status="sent"
        previewUrl="https://ethereal.email/message/12345"
      />
    );
    expect(screen.getByText('Sent')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /preview/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://ethereal.email/message/12345');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders Failed badge with lastError description underneath', () => {
    render(
      <StatusBadge
        status="failed"
        lastError="550 Mailbox unavailable"
      />
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('550 Mailbox unavailable')).toBeInTheDocument();
  });
});
