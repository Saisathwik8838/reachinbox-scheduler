import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileText, X, Calendar, Send } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { parseLeadsContent, ParseLeadsResult } from '../lib/csv';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { showToast } = useToast();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [startTime, setStartTime] = useState(() => {
    // Default to current time formatted for datetime-local
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [delayBetweenSeconds, setDelayBetweenSeconds] = useState<string>('5');
  const [hourlyLimit, setHourlyLimit] = useState<string>('100');

  // Leads File state
  const [leadsData, setLeadsData] = useState<ParseLeadsResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process selected file
  const handleFileProcess = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const result = parseLeadsContent(content, file.name, file.size);
        setLeadsData(result);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemoveFile = () => {
    setLeadsData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validation
  const isValid = useMemo(() => {
    return (
      subject.trim().length > 0 &&
      body.trim().length > 0 &&
      leadsData !== null &&
      leadsData.validEmails.length > 0 &&
      Boolean(startTime)
    );
  }, [subject, body, leadsData, startTime]);

  // Live schedule spread summary preview
  const scheduleSummary = useMemo(() => {
    if (!leadsData || leadsData.validEmails.length === 0) return null;

    const count = leadsData.validEmails.length;
    const limit = parseInt(hourlyLimit, 10) || 100;

    if (count <= limit) {
      return `${count} emails · all send in the first hour`;
    }

    const firstHour = limit;
    const remainder = count - limit;
    return `${count} emails · ${firstHour} send in the first hour, ${remainder} roll into the next`;
  }, [leadsData, hourlyLimit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !leadsData) return;

    setIsSubmitting(true);
    try {
      const parsedDelay = parseInt(delayBetweenSeconds, 10) || 0;
      const parsedLimit = hourlyLimit ? parseInt(hourlyLimit, 10) : undefined;
      const parsedStartTime = new Date(startTime).toISOString();

      const response = await api.scheduleEmails({
        subject: subject.trim(),
        body: body.trim(),
        recipients: leadsData.validEmails,
        startTime: parsedStartTime,
        delayBetweenSeconds: parsedDelay,
        hourlyLimit: parsedLimit,
      });

      showToast(
        'success',
        'Emails scheduled successfully',
        `${response.accepted} emails have been scheduled.`
      );

      // Reset and close
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule emails';
      showToast('error', 'Scheduling failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose New Email">
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* 2-Column Body Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Subject & Email body */}
          <div className="flex flex-col gap-4">
            <Input
              label="Subject"
              placeholder="Enter a subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />

            <Textarea
              label="Email body"
              placeholder="Write your message..."
              rows={11}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[260px]"
              required
            />
          </div>

          {/* Right Column: Leads & Schedule settings */}
          <div className="flex flex-col gap-5">
            {/* Leads Section */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700">Leads</span>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileChange}
              />

              {!leadsData ? (
                /* File dropzone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center min-h-[120px]
                    ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
                    <Upload className="w-4 h-4 stroke-[2]" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">
                    Drag and drop your leads file, or{' '}
                    <span className="text-blue-600 font-semibold hover:underline">
                      browse
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    CSV or TXT · one email address per row
                  </p>
                </div>
              ) : (
                /* Selected file card */
                <div className="flex flex-col gap-2.5">
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-white flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-slate-900 truncate max-w-[180px]">
                          {leadsData.fileName || 'leads.csv'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {leadsData.fileSizeFormatted ? `${leadsData.fileSizeFormatted} · ` : ''}
                          {leadsData.totalRowsCount} rows
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-1 py-0.5"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Detection Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ {leadsData.validEmails.length} valid email addresses detected
                    </span>
                    {leadsData.invalidRowsCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        ⚠ {leadsData.invalidRowsCount} invalid rows
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Settings Section */}
            <div className="flex flex-col gap-3 pt-2">
              <span className="text-xs font-semibold text-slate-900">
                Schedule settings
              </span>

              {/* Start Time */}
              <Input
                label="Start time"
                type="datetime-local"
                leftIcon={<Calendar className="w-4 h-4" />}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />

              {/* Delay and Limit Sub-grid */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Delay between emails"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 5"
                  value={delayBetweenSeconds}
                  onChange={(e) => setDelayBetweenSeconds(e.target.value)}
                  rightAdornment="seconds"
                  sublabel="Minimum gap between sends"
                />

                <Input
                  label="Hourly email limit"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 100"
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(e.target.value)}
                  rightAdornment="emails/hour"
                  sublabel="Extra emails roll into the next hour"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 text-left">
            {scheduleSummary ? (
              <span className="text-slate-600 font-medium">{scheduleSummary}</span>
            ) : (
              'Add a subject, body, leads, and start time to continue'
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!isValid}
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Schedule Emails
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
