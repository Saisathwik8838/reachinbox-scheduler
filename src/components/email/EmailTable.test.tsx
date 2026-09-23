import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailTable, ColumnDef } from './EmailTable';

interface TestItem {
  id: string;
  recipient: string;
  subject: string;
}

const mockColumns: ColumnDef<TestItem>[] = [
  { key: 'recipient', header: 'Recipient', render: (item) => item.recipient },
  { key: 'subject', header: 'Subject', render: (item) => item.subject },
];

describe('EmailTable', () => {
  it('renders skeleton rows when isLoading is true while keeping headers visible', () => {
    render(
      <EmailTable<TestItem>
        data={undefined}
        columns={mockColumns}
        isLoading={true}
        isError={false}
        page={1}
        pageSize={10}
        total={0}
        onPageChange={vi.fn()}
        emptyTitle="No items"
        emptyDescription="Empty"
      />
    );

    expect(screen.getByText('Recipient')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    // Verify 9 skeleton rows rendered
    const tableRows = screen.getAllByRole('row');
    expect(tableRows.length).toBe(10); // 1 header row + 9 skeleton rows
  });

  it('renders data rows and pagination footer correctly', () => {
    const data: TestItem[] = [
      { id: '1', recipient: 'alice@example.com', subject: 'Hello Alice' },
      { id: '2', recipient: 'bob@example.com', subject: 'Hello Bob' },
    ];

    render(
      <EmailTable<TestItem>
        data={data}
        columns={mockColumns}
        isLoading={false}
        isError={false}
        page={1}
        pageSize={10}
        total={42}
        onPageChange={vi.fn()}
        emptyTitle="No items"
        emptyDescription="Empty"
      />
    );

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('handles pagination next and previous buttons', async () => {
    const handlePageChange = vi.fn();

    render(
      <EmailTable<TestItem>
        data={[{ id: '1', recipient: 'test@example.com', subject: 'Test' }]}
        columns={mockColumns}
        isLoading={false}
        isError={false}
        page={2}
        pageSize={10}
        total={30}
        onPageChange={handlePageChange}
        emptyTitle="No items"
        emptyDescription="Empty"
      />
    );

    const prevButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });

    expect(prevButton).toBeEnabled();
    expect(nextButton).toBeEnabled();

    await userEvent.click(nextButton);
    expect(handlePageChange).toHaveBeenCalledWith(3);

    await userEvent.click(prevButton);
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('renders error state and handles retry action', async () => {
    const handleRetry = vi.fn();

    render(
      <EmailTable<TestItem>
        data={undefined}
        columns={mockColumns}
        isLoading={false}
        isError={true}
        error={new Error('Connection timed out')}
        onRetry={handleRetry}
        page={1}
        pageSize={10}
        total={0}
        onPageChange={vi.fn()}
        emptyTitle="No items"
        emptyDescription="Empty"
      />
    );

    expect(screen.getByText('Unable to load emails')).toBeInTheDocument();
    expect(screen.getByText('Connection timed out')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when data is empty and not loading', () => {
    render(
      <EmailTable<TestItem>
        data={[]}
        columns={mockColumns}
        isLoading={false}
        isError={false}
        page={1}
        pageSize={10}
        total={0}
        onPageChange={vi.fn()}
        emptyTitle="No scheduled emails"
        emptyDescription="Your scheduled emails will appear here."
      />
    );

    expect(screen.getByText('No scheduled emails')).toBeInTheDocument();
    expect(screen.getByText('Your scheduled emails will appear here.')).toBeInTheDocument();
  });
});
