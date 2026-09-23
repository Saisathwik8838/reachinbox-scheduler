import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../lib/api';
import { usePageVisibility } from './usePageVisibility';
import { Email } from '../types/email';
import { PaginatedResponse } from '../types/api';

export const EMAIL_QUERY_KEYS = {
  all: ['emails'] as const,
  scheduled: (page: number, pageSize: number) => ['emails', 'scheduled', page, pageSize] as const,
  sent: (page: number, pageSize: number) => ['emails', 'sent', page, pageSize] as const,
};

/**
 * Hook to fetch paginated scheduled emails with ~10s polling that pauses when the tab is hidden.
 */
export function useScheduledEmails(page: number = 1, pageSize: number = 10) {
  const isTabVisible = usePageVisibility();

  return useQuery<PaginatedResponse<Email>, Error>({
    queryKey: EMAIL_QUERY_KEYS.scheduled(page, pageSize),
    queryFn: () => api.getScheduledEmails(page, pageSize),
    placeholderData: keepPreviousData,
    refetchInterval: isTabVisible ? 10000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch paginated sent emails.
 */
export function useSentEmails(page: number = 1, pageSize: number = 10) {
  return useQuery<PaginatedResponse<Email>, Error>({
    queryKey: EMAIL_QUERY_KEYS.sent(page, pageSize),
    queryFn: () => api.getSentEmails(page, pageSize),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to invalidate email queries across Scheduled and Sent tabs.
 * Useful after scheduling a job or when items transition from scheduled to sent.
 */
export function useInvalidateEmails() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: EMAIL_QUERY_KEYS.all });
  };
}
