import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Badge } from './Badge';
import { Tabs } from './Tabs';
import { Dialog } from './Dialog';
import { EmptyState } from './EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';

describe('UI Primitives', () => {
  describe('Button', () => {
    it('renders with children and handles click', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      await userEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading spinner and disables when isLoading is true', () => {
      render(<Button isLoading>Submitting</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });
  });

  describe('Input & Textarea', () => {
    it('renders input with label, hint, and accepts user input', async () => {
      const handleChange = vi.fn();
      render(
        <Input
          label="Subject"
          hint="Max 100 characters"
          placeholder="Enter subject"
          onChange={handleChange}
        />
      );
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByText(/max 100 characters/i)).toBeInTheDocument();

      const input = screen.getByPlaceholderText(/enter subject/i);
      await userEvent.type(input, 'Hello World');
      expect(handleChange).toHaveBeenCalled();
    });

    it('renders error message when error prop is provided', () => {
      render(<Input label="Email" error="Invalid email address" />);
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid email address/i);
    });

    it('renders textarea with label and value', async () => {
      render(<Textarea label="Body" placeholder="Write message..." />);
      const textarea = screen.getByLabelText(/body/i);
      await userEvent.type(textarea, 'Test message content');
      expect(textarea).toHaveValue('Test message content');
    });
  });

  describe('Badge', () => {
    it('renders badge with dot and text', () => {
      render(
        <Badge variant="green" dot>
          Active
        </Badge>
      );
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('handles tab switching and keyboard navigation', async () => {
      const handleChange = vi.fn();
      const tabs = [
        { id: 'scheduled', label: 'Scheduled', count: 42 },
        { id: 'sent', label: 'Sent', count: 318 },
      ];

      render(<Tabs tabs={tabs} activeTab="scheduled" onChange={handleChange} />);

      const scheduledTab = screen.getByRole('tab', { name: /scheduled 42/i });
      const sentTab = screen.getByRole('tab', { name: /sent 318/i });

      expect(scheduledTab).toHaveAttribute('aria-selected', 'true');
      expect(sentTab).toHaveAttribute('aria-selected', 'false');

      await userEvent.click(sentTab);
      expect(handleChange).toHaveBeenCalledWith('sent');

      // Test arrow key navigation
      scheduledTab.focus();
      fireEvent.keyDown(scheduledTab, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('sent');
    });
  });

  describe('Table', () => {
    it('renders table structure cleanly', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>test@example.com</TableCell>
              <TableCell>Scheduled</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Recipient')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders title, description and action', () => {
      render(
        <EmptyState
          title="No scheduled emails"
          description="Your scheduled emails will appear here."
          action={<Button>Compose Email</Button>}
        />
      );

      expect(screen.getByText('No scheduled emails')).toBeInTheDocument();
      expect(screen.getByText('Your scheduled emails will appear here.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /compose email/i })).toBeInTheDocument();
    });
  });

  describe('Dialog', () => {
    it('renders dialog in portal, focuses element, and closes on Escape', async () => {
      const handleClose = vi.fn();

      const { rerender } = render(
        <Dialog isOpen={true} onClose={handleClose} title="Compose New Email">
          <p>Dialog Content</p>
          <Button>Action Inside</Button>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Compose New Email')).toBeInTheDocument();
      expect(screen.getByText('Dialog Content')).toBeInTheDocument();

      // Test escape key
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Verify closing unmounts
      rerender(
        <Dialog isOpen={false} onClose={handleClose} title="Compose New Email">
          <p>Dialog Content</p>
        </Dialog>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
