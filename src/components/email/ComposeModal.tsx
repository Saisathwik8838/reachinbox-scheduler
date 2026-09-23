import React, { useState, useEffect, useMemo } from 'react';
import { Send, Calendar, AlertCircle } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { RecipientUpload } from './RecipientUpload';
import { ParseResult } from '../../lib/csvParser';
import { estimateSendPlan } from '../../lib/sendPlanEstimator';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useInvalidateEmails } from '../../hooks/useEmails';

export interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: () => void;
}

/**
 * Returns default ISO string formatted for input[type="datetime-local"]
 * Defaults to 10 minutes in the future.
 */
function getDefaultLocalStartTime(): string {
  const d = new Date(Date.now() + 10 * 60 * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function ComposeModal({
  isOpen,
  onClose,
  onSuccessNavigate,
}: ComposeModalProps): React.ReactElement | null {
  const { success, error: toastError } = useToast();
  const invalidateEmails = useInvalidateEmails();

  // Form State
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [leads, setLeads] = useState<ParseResult | null>(null);
  const [startTime, setStartTime] = useState(getDefaultLocalStartTime());
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [hourlyLimit, setHourlyLimit] = useState(100);

  // Status & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Reset form whenever modal opens fresh
  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setBody('');
      setLeads(null);
      setStartTime(getDefaultLocalStartTime());
      setDelaySeconds(5);
      setHourlyLimit(100);
      setIsSubmitting(false);
      setGeneralError(null);
      setFieldErrors({});
      setShowDiscardConfirm(false);
    }
  }, [isOpen]);

  const hasUnsavedChanges = useMemo(() => {
    return !!(subject.trim() || body.trim() || leads);
  }, [subject, body, leads]);

  const handleRequestClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  // Convert selected local datetime string to UTC ISO string
  const startAtUtc = useMemo(() => {
    if (!startTime) return '';
    const date = new Date(startTime);
    return isNaN(date.getTime()) ? '' : date.toISOString();
  }, [startTime]);

  // Live Send Plan estimation
  const sendPlan = useMemo(() => {
    if (!leads || leads.validCount === 0 || !startAtUtc) {
      return null;
    }
    return estimateSendPlan({
      recipientCount: leads.validCount,
      startAt: startAtUtc,
      delaySeconds,
      hourlyLimit,
    });
  }, [leads, startAtUtc, delaySeconds, hourlyLimit]);

  // Is past scheduled start time check
  const isPastTime = useMemo(() => {
    if (!startTime) return false;
    const picked = new Date(startTime).getTime();
    return picked < Date.now() - 60000;
  }, [startTime]);

  const isFormValid = useMemo(() => {
    return !!(
      subject.trim() &&
      body.trim() &&
      leads &&
      leads.validCount > 0 &&
      startTime &&
      delaySeconds >= 0 &&
      hourlyLimit > 0
    );
  }, [subject, body, leads, startTime, delaySeconds, hourlyLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const response = await api.scheduleEmails({
        subject: subject.trim(),
        body: body.trim(),
        recipients: leads!.validEmails,
        startAt: startAtUtc,
        delaySeconds,
        hourlyLimit,
      });

      // Show success toast with scheduled count matching Screen 7
      const scheduledCount = response.accepted ?? leads!.validCount;
      success(
        'Emails scheduled successfully',
        `${scheduledCount} email${scheduledCount === 1 ? '' : 's'} have been scheduled.`
      );

      // Refresh queries across tabs
      invalidateEmails();

      // Navigate to Scheduled tab and close modal
      if (onSuccessNavigate) {
        onSuccessNavigate();
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) {
          setFieldErrors(err.fieldErrors);
        }
        setGeneralError(err.message);
      } else {
        const msg = err instanceof Error ? err.message : 'Failed to schedule emails';
        setGeneralError(msg);
        toastError('Scheduling Failed', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={handleRequestClose}
        title="Compose New Email"
        maxWidth="max-w-[900px]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Top general error banner if submission failed */}
          {generalError && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-700"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold">Unable to schedule emails: </span>
                {generalError}
              </div>
            </div>
          )}

          {/* Two-column layout matching Figma Screens 3 & 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Column: Subject & Email Body */}
            <div className="flex flex-col gap-4">
              <Input
                label="Subject"
                id="email-subject"
                placeholder="Enter a subject line"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (fieldErrors.subject) {
                    setFieldErrors((prev) => ({ ...prev, subject: '' }));
                  }
                }}
                error={fieldErrors.subject}
                required
              />

              <div className="flex flex-col flex-1">
                <Textarea
                  label="Email body"
                  id="email-body"
                  placeholder="Write your message..."
                  rows={9}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    if (fieldErrors.body) {
                      setFieldErrors((prev) => ({ ...prev, body: '' }));
                    }
                  }}
                  error={fieldErrors.body}
                  className="flex-1 min-h-[200px]"
                  required
                />
              </div>
            </div>

            {/* Right Column: Leads File & Schedule Settings */}
            <div className="flex flex-col gap-5">
              <RecipientUpload
                value={leads}
                onChange={(newLeads) => {
                  setLeads(newLeads);
                  if (fieldErrors.recipients) {
                    setFieldErrors((prev) => ({ ...prev, recipients: '' }));
                  }
                }}
                error={fieldErrors.recipients}
              />

              {/* Schedule Settings section */}
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Schedule settings
                </span>

                {/* Start Time input */}
                <div>
                  <Input
                    label="Start time"
                    id="start-time"
                    type="datetime-local"
                    leftIcon={<Calendar className="w-4 h-4" />}
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value);
                      if (fieldErrors.startAt) {
                        setFieldErrors((prev) => ({ ...prev, startAt: '' }));
                      }
                    }}
                    error={fieldErrors.startAt}
                    required
                  />
                  {isPastTime && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100/80 rounded-md p-2 mt-1.5 leading-normal">
                      Start time is in the past — sending will begin immediately subject to rate limits.
                    </p>
                  )}
                </div>

                {/* Delay & Hourly Limit side-by-side */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Delay between emails"
                    id="delay-seconds"
                    type="number"
                    min={0}
                    max={3600}
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Math.max(0, parseInt(e.target.value) || 0))}
                    rightAddon="seconds"
                    hint="Minimum gap between sends"
                    error={fieldErrors.delaySeconds}
                  />

                  <Input
                    label="Hourly email limit"
                    id="hourly-limit"
                    type="number"
                    min={1}
                    max={10000}
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(Math.max(1, parseInt(e.target.value) || 1))}
                    rightAddon="emails/hour"
                    hint="Extra emails roll into the next hour"
                    error={fieldErrors.hourlyLimit}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer (Screen 3 & 4) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100 mt-2">
            {/* Left: Helper status hint or signature Send Plan summary */}
            <div className="text-xs text-gray-500 text-center sm:text-left flex-1 min-w-0">
              {sendPlan ? (
                <span
                  title="Estimated single-sender schedule based on clock-hour windows"
                  className="font-medium text-gray-700"
                >
                  {sendPlan.summarySentence}
                </span>
              ) : (
                <span className="text-gray-400">
                  Add a subject, body, leads and start time to continue
                </span>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleRequestClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!isFormValid || isSubmitting}
                isLoading={isSubmitting}
                rightIcon={<Send className="w-4 h-4 stroke-[2.2]" />}
              >
                Schedule Emails
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Confirmation Dialog on Unsaved Changes */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard unsaved email?"
        description="You have entered information for this email campaign. If you discard now, your draft and lead list will be lost."
        confirmText="Discard changes"
        cancelText="Keep editing"
        isDestructive={true}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
