import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Header } from '../components/Header';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { EmailTable } from '../components/EmailTable';
import { ComposeModal } from '../components/ComposeModal';
import { useEmails } from '../hooks/useEmails';

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const {
    emails,
    total,
    page,
    limit,
    stats,
    isLoading,
    isError,
    setPage,
    refetch,
  } = useEmails(activeTab);

  // Format next send subtitle: "42 emails scheduled · Next send today at 4:30 PM"
  const formatNextSend = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const timeStr = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      if (isToday) {
        return `today at ${timeStr}`;
      }
      const monthStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${monthStr} at ${timeStr}`;
    } catch {
      return dateString;
    }
  };

  const scheduledSubtitle = `${stats.scheduledCount} emails scheduled${
    stats.nextSendAt ? ` · Next send ${formatNextSend(stats.nextSendAt)}` : ''
  }`;

  const sentSubtitle = `Delivery results · ${stats.failedLast24h || 0} failed in the last 24 hours`;

  const tabs = [
    { id: 'scheduled', label: 'Scheduled', count: stats.scheduledCount },
    { id: 'sent', label: 'Sent', count: stats.sentCount },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top Header Navigation */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Page Title & Context Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Emails
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {activeTab === 'scheduled' ? scheduledSubtitle : sentSubtitle}
          </p>
        </div>

        {/* Action Bar: Tabs on Left, Compose Button on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as 'scheduled' | 'sent')}
          />

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsComposeOpen(true)}
            leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            className="self-start sm:self-auto shrink-0 shadow-sm"
          >
            Compose New Email
          </Button>
        </div>

        {/* Table View */}
        <EmailTable
          type={activeTab}
          emails={emails}
          isLoading={isLoading}
          isError={isError}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onRetry={refetch}
          onComposeClick={() => setIsComposeOpen(true)}
        />
      </main>

      {/* Compose New Email Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={() => {
          refetch();
          if (activeTab !== 'scheduled') {
            setActiveTab('scheduled');
          }
        }}
      />
    </div>
  );
};
