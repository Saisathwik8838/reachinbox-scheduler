import React from 'react';
import { Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  type: 'scheduled' | 'sent' | 'error';
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4 text-rose-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Unable to load emails
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          Something went wrong. Please try again.
        </p>
        {onAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAction}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        )}
      </div>
    );
  }

  const isScheduled = type === 'scheduled';
  const title = isScheduled ? 'No scheduled emails' : 'No sent emails yet';
  const description = isScheduled
    ? 'Your scheduled emails will appear here.'
    : 'Your sent emails will appear here.';

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
        <Mail className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {isScheduled && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          + Compose New Email
        </Button>
      )}
    </div>
  );
};
