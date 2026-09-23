/**
 * Email status variants seen across Scheduled and Sent tabs
 */
export type EmailStatus = 'scheduled' | 'rescheduled' | 'sending' | 'sent' | 'failed';

/**
 * Core email record returned by scheduled and sent endpoints
 */
export interface Email {
  id: string;
  recipient: string;
  subject: string;
  status: EmailStatus;
  scheduledAt: string; // ISO string
  sentAt: string | null; // ISO string
  lastError: string | null;
  previewUrl: string | null;
}

/**
 * Payload sent to POST /api/emails/schedule
 */
export interface ScheduleEmailPayload {
  subject: string;
  body: string;
  recipients: string[];
  startAt: string; // ISO UTC string
  delaySeconds: number;
  hourlyLimit: number;
}

/**
 * Response received from POST /api/emails/schedule
 */
export interface ScheduleEmailResponse {
  accepted: number;
  invalid: number;
  duplicates: number;
}
