export type EmailStatus = 'scheduled' | 'sent' | 'failed';

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt?: string;
}

export interface Email {
  id: string;
  userId: string;
  batchId: string;
  recipient: string;
  subject: string;
  body: string;
  senderId: string;
  scheduledAt: string;
  sentAt: string | null;
  status: EmailStatus;
  hourlyLimit: number | null;
  attempts: number;
  rescheduleCount: number;
  error: string | null;
  messageId: string | null;
  previewUrl: string | null;
  createdAt: string;
}

export interface ScheduleRequest {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string; // ISO string
  delayBetweenSeconds: number;
  hourlyLimit?: number;
}

export interface ScheduleResponse {
  batchId: string;
  total: number;
  accepted: number;
  invalid: number;
  firstSendAt: string;
  lastSendAt: string;
}

export interface EmailStats {
  scheduledCount: number;
  sentCount: number;
  failedLast24h?: number;
  nextSendAt?: string | null;
}

export interface PaginatedEmails {
  emails: Email[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: EmailStats;
}
