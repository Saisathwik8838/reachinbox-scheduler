import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Email } from '../types/email';
import { Avatar } from './ui/Avatar';
import { StatusBadge } from './ui/StatusBadge';
import { TableSkeleton } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/Button';

interface EmailTableProps {
  type: 'scheduled' | 'sent';
  emails: Email[];
  isLoading: boolean;
  isError: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onRetry: () => void;
  onComposeClick: () => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({
  type,
  emails,
  isLoading,
  isError,
  total,
  page,
  limit,
  onPageChange,
  onRetry,
  onComposeClick,
}) => {
  const isScheduled = type === 'scheduled';

  // Format date helper: "Sep 23, 4:30:00 PM"
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  // Pagination bounds
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      {/* Table Content */}
      <div className="overflow-x-auto min-h-[360px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-white">
              <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 w-1/4">
                Recipient
              </th>
              <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 w-2/5">
                Subject
              </th>
              <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 w-1/5">
                {isScheduled ? 'Scheduled time' : 'Sent time'}
              </th>
              <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 text-right w-1/6">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-0">
                  <TableSkeleton rows={8} />
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={4} className="p-0">
                  <EmptyState type="error" onAction={onRetry} />
                </td>
              </tr>
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-0">
                  <EmptyState
                    type={isScheduled ? 'scheduled' : 'sent'}
                    onAction={isScheduled ? onComposeClick : undefined}
                  />
                </td>
              </tr>
            ) : (
              emails.map((email) => {
                const targetTime = isScheduled ? email.scheduledAt : email.sentAt;

                return (
                  <tr
                    key={email.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Recipient */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={email.recipient}
                          size="sm"
                          variant="table"
                        />
                        <span className="text-sm font-medium text-slate-900 truncate max-w-[240px]">
                          {email.recipient}
                        </span>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-700 truncate max-w-[360px]">
                          {email.subject}
                        </span>
                        {email.previewUrl && (
                          <a
                            href={email.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title="View Ethereal Email Preview"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-6 text-sm text-slate-500 whitespace-nowrap">
                      {formatDate(targetTime)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex justify-end">
                        <StatusBadge
                          status={email.status}
                          error={email.error}
                          rescheduleCount={email.rescheduleCount}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && !isError && total > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
          <div>
            Showing {startItem}–{endItem} of {total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
