import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipientUpload } from './RecipientUpload';
import { ParseResult } from '../../lib/csvParser';

const mockParseResult: ParseResult = {
  fileName: 'leads.csv',
  fileSizeBytes: 14540,
  formattedFileSize: '14.2 KB',
  totalRows: 135,
  validCount: 127,
  invalidCount: 8,
  duplicateCount: 0,
  validEmails: ['test1@example.com', 'test2@example.com'],
  rejectedRows: [
    { rowNumber: 4, value: 'invalid-email', reason: 'Invalid email format' },
  ],
};

describe('RecipientUpload', () => {
  it('renders empty dropzone state matching Screen 3', () => {
    render(<RecipientUpload value={null} onChange={vi.fn()} />);

    expect(screen.getByText(/drag and drop your leads file/i)).toBeInTheDocument();
    expect(screen.getByText(/one email address per row/i)).toBeInTheDocument();
  });

  it('renders loaded file card matching Screen 4 with valid and invalid badges', () => {
    render(<RecipientUpload value={mockParseResult} onChange={vi.fn()} />);

    expect(screen.getByText('leads.csv')).toBeInTheDocument();
    expect(screen.getByText(/14.2 KB · 135 rows/i)).toBeInTheDocument();
    expect(screen.getByText(/127 valid email addresses detected/i)).toBeInTheDocument();
    expect(screen.getByText(/8 invalid \/ duplicate rows/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replace/i })).toBeInTheDocument();
  });

  it('triggers onChange(null) when remove button is clicked', async () => {
    const handleChange = vi.fn();
    render(<RecipientUpload value={mockParseResult} onChange={handleChange} />);

    const removeBtn = screen.getByRole('button', { name: /remove uploaded file/i });
    await userEvent.click(removeBtn);

    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('displays expandable rejected details on click', async () => {
    render(<RecipientUpload value={mockParseResult} onChange={vi.fn()} />);

    const detailsToggle = screen.getByText(/8 invalid \/ duplicate rows/i);
    await userEvent.click(detailsToggle);

    expect(screen.getByText(/first rejected items/i)).toBeInTheDocument();
    expect(screen.getByText(/row 4: invalid-email/i)).toBeInTheDocument();
  });

  it('renders external validation error message', () => {
    render(
      <RecipientUpload
        value={null}
        onChange={vi.fn()}
        error="Please upload a valid leads file"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/please upload a valid leads file/i);
  });
});
