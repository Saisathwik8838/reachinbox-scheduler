import { useState, useEffect, useCallback, useRef } from 'react';
import { Email, EmailStats } from '../types/email';
import { api } from '../lib/api';

export function useEmails(activeTab: 'scheduled' | 'sent') {
  const [emails, setEmails] = useState<Email[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [stats, setStats] = useState<EmailStats>({
    scheduledCount: 0,
    sentCount: 0,
    failedLast24h: 0,
    nextSendAt: null,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Keep track of activeTab in ref to avoid race conditions in asynchronous responses
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const fetchEmails = useCallback(
    async (isBackground: boolean = false) => {
      if (!isBackground) {
        setIsLoading(true);
      }
      setIsError(false);

      try {
        const response =
          activeTabRef.current === 'scheduled'
            ? await api.getScheduledEmails(page, limit)
            : await api.getSentEmails(page, limit);

        setEmails(response.emails);
        setTotal(response.total);
        if (response.stats) {
          setStats((prev) => ({
            ...prev,
            ...response.stats,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch emails:', err);
        if (!isBackground) {
          setIsError(true);
        }
      } finally {
        if (!isBackground) {
          setIsLoading(false);
        }
      }
    },
    [page, limit]
  );

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
    fetchEmails(false);
  }, [activeTab, fetchEmails]);

  // Refetch when page changes
  useEffect(() => {
    fetchEmails(false);
  }, [page, fetchEmails]);

  // Poll every 10 seconds for email updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEmails(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchEmails]);

  return {
    emails,
    total,
    page,
    limit,
    stats,
    isLoading,
    isError,
    setPage,
    refetch: () => fetchEmails(false),
  };
}
