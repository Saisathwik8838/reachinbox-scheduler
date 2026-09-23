import React from 'react';
import { ExternalLink } from 'lucide-react';
import { EmailStatus } from '../../types/email';

export interface StatusBadgeProps {
  status: EmailStatus;
  lastError?: string | null;
  previewUrl?: string | null;
  className?: string;
}

export function StatusBadge({
  status,
  lastError,
  previewUrl,
  className = '',
}: StatusBadgeProps): React.ReactElement {
  const configs = {
    sending: {
      label: 'Sending',
      badgeClass: 'bg-blue-600 text-white font-medium shadow-xs',
      dotClass: 'bg-white',
      pulse: true,
    },
    scheduled: {
      label: 'Scheduled',
      badgeClass: 'bg-blue-50 text-blue-700 border border-blue-100/80 font-medium',
      dotClass: 'bg-blue-500',
      pulse: false,
    },
    rescheduled: {
      label: 'Rescheduled',
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-medium',
      dotClass: 'bg-amber-500',
      pulse: false,
      subtext: 'Hourly limit reached',
    },
    sent: {
      label: 'Sent',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100/80 font-medium',
      dotClass: 'bg-emerald-500',
      pulse: false,
    },
    failed: {
      label: 'Failed',
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-100/80 font-medium',
      dotClass: 'bg-rose-500',
      pulse: false,
    },
  };

  const config = configs[status] || configs.scheduled;

  return (
    <div className={`flex flex-col items-start gap-1 select-none ${className}`}>
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs transition-colors ${config.badgeClass}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${config.dotClass} ${
              config.pulse ? 'animate-pulse' : ''
            }`}
            aria-hidden="true"
          />
          <span>{config.label}</span>
        </span>

        {/* Ethereal preview link for sent emails if present */}
        {status === 'sent' && previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="View email preview on Ethereal"
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline p-0.5 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
          >
            <span>Preview</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Rescheduled subtext */}
      {status === 'rescheduled' && (
        <span className="text-[11px] text-amber-700 font-normal pl-0.5">
          Hourly limit reached
        </span>
      )}

      {/* Failed delivery error reason */}
      {status === 'failed' && lastError && (
        <span
          title={lastError}
          className="text-[11px] text-gray-500 font-normal truncate max-w-[200px] pl-0.5"
        >
          {lastError}
        </span>
      )}
    </div>
  );
}
