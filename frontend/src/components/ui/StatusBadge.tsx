import React from 'react';
import { EmailStatus } from '../../types/email';

export interface StatusBadgeProps {
  status: EmailStatus | 'rescheduled' | 'sending';
  error?: string | null;
  rescheduleCount?: number;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  error,
  rescheduleCount = 0,
  className = '',
}) => {
  // Mark rescheduled if delayed due to hourly rate limits
  const effectiveStatus = status === 'scheduled' && rescheduleCount > 0 ? 'rescheduled' : status;

  switch (effectiveStatus) {
    case 'sending':
      return (
        <div className={`inline-flex flex-col items-start ${className}`}>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse-dot" />
            Sending
          </span>
        </div>
      );

    case 'rescheduled':
      return (
        <div className={`inline-flex flex-col items-start ${className}`}>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Rescheduled
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 font-normal">
            Hourly limit reached
          </span>
        </div>
      );

    case 'scheduled':
      return (
        <div className={`inline-flex flex-col items-start ${className}`}>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Scheduled
          </span>
        </div>
      );

    case 'sent':
      return (
        <div className={`inline-flex flex-col items-start ${className}`}>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Sent
          </span>
        </div>
      );

    case 'failed':
      return (
        <div className={`inline-flex flex-col items-start ${className}`}>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Failed
          </span>
          {error && (
            <span className="text-[11px] text-slate-400 mt-0.5 font-normal max-w-[200px] truncate" title={error}>
              {error}
            </span>
          )}
        </div>
      );

    default:
      return null;
  }
};
