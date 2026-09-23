import React, { useState, useEffect, useMemo } from 'react';
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Header } from '../components/email/Header';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { EmailTable, ColumnDef } from '../components/email/EmailTable';
import { StatusBadge } from '../components/email/StatusBadge';
import { useScheduledEmails, useSentEmails } from '../hooks/useEmails';
import { Email } from '../types/email';
import { getInitials } from '../lib/avatarUtils';
import {
  formatCompactDateTime,
  formatRelativeHint,
  formatFullDateTimeWithZone,
} from '../lib/dateUtils';

import { ComposeModal } from '../components/email/ComposeModal';

export function DashboardPage(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Listen for open-compose-modal custom event
  useEffect(() => {
    const handleOpen = () => setIsComposeOpen(true);
    window.addEventListener('open-compose-modal', handleOpen);
    return () => window.removeEventListener('open-compose-modal', handleOpen);
  }, []);

  // Active tab derived directly from URL path
  const isSentTab = location.pathname.includes('/sent');
  const activeTabId = isSentTab ? 'sent' : 'scheduled';

  // Read pagination parameters from URL with fallbacks
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.max(5, parseInt(searchParams.get('pageSize') || '10', 10));

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString(), pageSize: pageSize.toString() });
  };

  const handlePageSizeChange = (newSize: number) => {
    setSearchParams({ page: '1', pageSize: newSize.toString() });
  };

  const handleTabChange = (tabId: string) => {
    navigate(`/dashboard/${tabId}?page=1&pageSize=${pageSize}`);
  };

  // Queries for scheduled and sent emails
  const scheduledQuery = useScheduledEmails(page, pageSize);
  const sentQuery = useSentEmails(page, pageSize);

  const activeQuery = isSentTab ? sentQuery : scheduledQuery;

  // Derive counts for tab pills
  const scheduledCount = scheduledQuery.data?.total ?? 0;
  const sentCount = sentQuery.data?.total ?? 0;

  // Derive dynamic header subtitle matching Figma screens
  const headerSubtitle = useMemo(() => {
    if (!isSentTab) {
      if (scheduledQuery.isLoading) return 'Loading scheduled emails...';
      if (!scheduledQuery.data || scheduledQuery.data.total === 0) {
        return 'No emails scheduled yet.';
      }
      const firstItem = scheduledQuery.data.items[0];
      const nextSendTime = firstItem ? formatCompactDateTime(firstItem.scheduledAt) : '';
      return `${scheduledQuery.data.total} emails scheduled ${
        nextSendTime ? `· Next send ${nextSendTime}` : ''
      }`;
    } else {
      if (sentQuery.isLoading) return 'Loading delivery results...';
      const failedCount =
        sentQuery.data?.items.filter((item) => item.status === 'failed').length || 0;
      return `Delivery results ${
        failedCount > 0 ? `· ${failedCount} failed in recent activity` : '· All delivered'
      }`;
    }
  }, [isSentTab, scheduledQuery.isLoading, scheduledQuery.data, sentQuery.isLoading, sentQuery.data]);

  // Column definitions for Scheduled View
  const scheduledColumns: ColumnDef<Email>[] = useMemo(
    () => [
      {
        key: 'recipient',
        header: 'Recipient',
        width: 'w-2/5 sm:w-1/3',
        render: (item) => {
          const initial = getInitials(null, item.recipient);
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div
                aria-hidden="true"
                className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold flex items-center justify-center shrink-0 uppercase select-none"
              >
                {initial}
              </div>
              <span
                title={item.recipient}
                className="text-sm font-medium text-gray-900 truncate"
              >
                {item.recipient}
              </span>
            </div>
          );
        },
      },
      {
        key: 'subject',
        header: 'Subject',
        width: 'w-2/5 sm:w-1/3',
        render: (item) => (
          <span
            title={item.subject}
            className="text-sm text-gray-700 truncate block max-w-xs md:max-w-md"
          >
            {item.subject}
          </span>
        ),
      },
      {
        key: 'scheduledAt',
        header: 'Scheduled time',
        width: 'w-1/4',
        render: (item) => {
          const formatted = formatCompactDateTime(item.scheduledAt);
          const relativeHint = formatRelativeHint(item.scheduledAt);
          const fullTime = formatFullDateTimeWithZone(item.scheduledAt);

          return (
            <div
              title={fullTime}
              className="flex items-center gap-2 cursor-default text-sm text-gray-700"
            >
              <span>{formatted}</span>
              {relativeHint && (
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  {relativeHint}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        width: 'w-28 text-right sm:text-left',
        render: (item) => <StatusBadge status={item.status} />,
      },
    ],
    []
  );

  // Column definitions for Sent View
  const sentColumns: ColumnDef<Email>[] = useMemo(
    () => [
      {
        key: 'recipient',
        header: 'Recipient',
        width: 'w-2/5 sm:w-1/3',
        render: (item) => {
          const initial = getInitials(null, item.recipient);
          return (
            <div className="flex items-center gap-3 min-w-0">
              <div
                aria-hidden="true"
                className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold flex items-center justify-center shrink-0 uppercase select-none"
              >
                {initial}
              </div>
              <span
                title={item.recipient}
                className="text-sm font-medium text-gray-900 truncate"
              >
                {item.recipient}
              </span>
            </div>
          );
        },
      },
      {
        key: 'subject',
        header: 'Subject',
        width: 'w-2/5 sm:w-1/3',
        render: (item) => (
          <span
            title={item.subject}
            className="text-sm text-gray-700 truncate block max-w-xs md:max-w-md"
          >
            {item.subject}
          </span>
        ),
      },
      {
        key: 'sentAt',
        header: 'Sent time',
        width: 'w-1/4',
        render: (item) => {
          const time = item.sentAt || item.scheduledAt;
          const formatted = formatCompactDateTime(time);
          const fullTime = formatFullDateTimeWithZone(time);

          return (
            <span title={fullTime} className="text-sm text-gray-700 cursor-default">
              {formatted}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        width: 'w-36 text-right sm:text-left',
        render: (item) => (
          <StatusBadge
            status={item.status}
            lastError={item.lastError}
            previewUrl={item.previewUrl}
          />
        ),
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
        {/* Title & Subtitle block */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Emails</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-normal">
            {headerSubtitle}
          </p>
        </div>

        {/* Tabs Bar & Compose Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200">
          <Tabs
            tabs={[
              { id: 'scheduled', label: 'Scheduled', count: scheduledCount },
              { id: 'sent', label: 'Sent', count: sentCount },
            ]}
            activeTab={activeTabId}
            onChange={handleTabChange}
          />

          <div className="pb-2.5 sm:pb-0">
            <Button
              id="compose-email-button"
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
              onClick={() => setIsComposeOpen(true)}
            >
              Compose New Email
            </Button>
          </div>
        </div>

        {/* Generic Table reused by both tabs */}
        <EmailTable<Email>
          data={activeQuery.data?.items}
          columns={isSentTab ? sentColumns : scheduledColumns}
          isLoading={activeQuery.isLoading}
          isFetching={activeQuery.isFetching}
          isError={activeQuery.isError}
          error={activeQuery.error}
          onRetry={() => activeQuery.refetch()}
          page={page}
          pageSize={pageSize}
          total={activeQuery.data?.total ?? 0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          emptyTitle={isSentTab ? 'No sent emails yet' : 'No scheduled emails'}
          emptyDescription={
            isSentTab
              ? 'Your sent emails will appear here.'
              : 'Your scheduled emails will appear here.'
          }
          emptyAction={
            !isSentTab ? (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
                onClick={() => setIsComposeOpen(true)}
              >
                Compose New Email
              </Button>
            ) : undefined
          }
        />
      </main>

      {/* Compose Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccessNavigate={() => navigate('/dashboard/scheduled?page=1')}
      />
    </div>
  );
}
