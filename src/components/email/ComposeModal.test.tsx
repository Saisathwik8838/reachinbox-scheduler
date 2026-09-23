import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ComposeModal } from './ComposeModal';
import { ToastProvider } from '../../context/ToastContext';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: {
    scheduleEmails: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    public status: number;
    public code: string;
    public fieldErrors?: Record<string, string>;
    constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
      super(message);
      this.status = status;
      this.code = code;
      this.fieldErrors = fieldErrors;
    }
  },
}));

describe('ComposeModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const renderModal = (isOpen = true, onClose = vi.fn()) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ComposeModal isOpen={isOpen} onClose={onClose} />
        </ToastProvider>
      </QueryClientProvider>
    );
  };

  it('renders modal in empty state with disabled Schedule button matching Screen 3', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Compose New Email')).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toHaveValue('');
    expect(screen.getByLabelText(/email body/i)).toHaveValue('');
    expect(screen.getByText(/drag and drop your leads file/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /schedule emails/i });
    expect(submitBtn).toBeDisabled();
    expect(
      screen.getByText(/add a subject, body, leads and start time to continue/i)
    ).toBeInTheDocument();
  });

  it('enables Schedule button and displays send plan summary when valid leads and content are input', async () => {
    renderModal();

    // Fill Subject & Body
    await userEvent.type(screen.getByLabelText(/subject/i), 'Welcome to our platform');
    await userEvent.type(screen.getByLabelText(/email body/i), 'Hello team!');

    // Upload a simulated CSV leads file
    const file = new File(
      ['user1@example.com\nuser2@example.com'],
      'leads.csv',
      { type: 'text/csv' }
    );
    const fileInput = screen.getByTestId('lead-file-input');
    await userEvent.upload(fileInput, file);

    // Verify leads parsed
    expect(await screen.findByText(/2 valid email addresses detected/i)).toBeInTheDocument();

    // Verify send plan summary appears
    expect(
      await screen.findByText(/2 emails · all send in the first hour/i)
    ).toBeInTheDocument();

    // Verify Schedule button is now enabled
    const submitBtn = screen.getByRole('button', { name: /schedule emails/i });
    expect(submitBtn).toBeEnabled();
  });

  it('submits valid form data to api.scheduleEmails and closes modal on success', async () => {
    const handleClose = vi.fn();
    (api.scheduleEmails as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      accepted: 2,
      invalid: 0,
      duplicates: 0,
    });

    renderModal(true, handleClose);

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Launch Campaign' },
    });
    fireEvent.change(screen.getByLabelText(/email body/i), {
      target: { value: 'Campaign content' },
    });

    const file = new File(['a@b.com\nc@d.com'], 'leads.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('lead-file-input');
    await userEvent.upload(fileInput, file);

    await screen.findByText(/2 valid email addresses detected/i);

    const submitBtn = screen.getByRole('button', { name: /schedule emails/i });
    expect(submitBtn).toBeEnabled();
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.scheduleEmails).toHaveBeenCalledTimes(1);
      expect(api.scheduleEmails).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Launch Campaign',
          body: 'Campaign content',
          recipients: ['a@b.com', 'c@d.com'],
          delaySeconds: 5,
          hourlyLimit: 100,
        })
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('prompts confirmation when attempting to close with unsaved changes', async () => {
    const handleClose = vi.fn();
    renderModal(true, handleClose);

    await userEvent.type(screen.getByLabelText(/subject/i), 'Unsaved draft');

    // Click cancel button
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelBtn);

    // Verify confirmation prompt appears
    expect(screen.getByText(/discard unsaved email\?/i)).toBeInTheDocument();
    expect(handleClose).not.toHaveBeenCalled();

    // Confirm discard
    const discardBtn = screen.getByRole('button', { name: /discard changes/i });
    await userEvent.click(discardBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
