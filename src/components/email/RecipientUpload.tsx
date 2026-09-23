import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { parseLeadFile, ParseResult } from '../../lib/csvParser';
import { Spinner } from '../ui/Spinner';

export interface RecipientUploadProps {
  value: ParseResult | null;
  onChange: (result: ParseResult | null) => void;
  error?: string;
}

export function RecipientUpload({
  value,
  onChange,
  error: externalError,
}: RecipientUploadProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showRejectedDetails, setShowRejectedDetails] = useState(false);

  const activeError = externalError || parseError;

  const handleFile = async (file: File) => {
    setParseError(null);
    setIsParsing(true);
    try {
      const result = await parseLeadFile(file);
      onChange(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file';
      setParseError(msg);
      onChange(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setParseError(null);
    setShowRejectedDetails(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReplaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const totalRejected = (value?.invalidCount || 0) + (value?.duplicateCount || 0);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Leads
        </label>
        {value && (
          <span className="text-xs text-gray-400">
            {value.validCount} valid lead{value.validCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleInputChange}
        className="hidden"
        data-testid="lead-file-input"
      />

      {/* State 1: Empty Dropzone (Screen 3) */}
      {!value && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none ${
            isDragging
              ? 'border-blue-500 bg-blue-50/40'
              : activeError
              ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400'
              : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/60'
          }`}
        >
          {isParsing ? (
            <div className="flex flex-col items-center gap-2.5 py-2">
              <Spinner size="md" className="text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Parsing leads...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mb-3 shadow-2xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700">
                Drag and drop your leads file, or{' '}
                <span className="text-blue-600 underline hover:text-blue-700">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                CSV or TXT — one email address per row
              </p>
            </>
          )}
        </div>
      )}

      {/* State 2: File Loaded Card (Screen 4) */}
      {value && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span
                  title={value.fileName}
                  className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-xs"
                >
                  {value.fileName}
                </span>
                <span className="text-xs text-gray-500">
                  {value.formattedFileSize} · {value.totalRows} row{value.totalRows === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Replace and Remove actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleReplaceClick}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:underline"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                aria-label="Remove uploaded file"
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Verification Badges (Screen 4) */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {/* Valid addresses badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {value.validCount} valid email address{value.validCount === 1 ? '' : 'es'} detected
              </span>
            </div>

            {/* Invalid or Duplicate rows badge */}
            {totalRejected > 0 && (
              <button
                type="button"
                onClick={() => setShowRejectedDetails(!showRejectedDetails)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100/60 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>
                  {totalRejected} invalid / duplicate row{totalRejected === 1 ? '' : 's'}
                </span>
                {showRejectedDetails ? (
                  <ChevronUp className="w-3 h-3 text-amber-600 ml-0.5" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-amber-600 ml-0.5" />
                )}
              </button>
            )}
          </div>

          {/* Expandable Preview of Rejected Entries */}
          {showRejectedDetails && value.rejectedRows.length > 0 && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 max-h-36 overflow-y-auto mt-1">
              <p className="font-semibold text-gray-900 mb-1.5">
                First rejected items (skipped automatically):
              </p>
              <ul className="divide-y divide-gray-200/70">
                {value.rejectedRows.map((r, i) => (
                  <li key={`rej-${i}`} className="py-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-gray-600 truncate max-w-[200px]">
                      Row {r.rowNumber}: {r.value}
                    </span>
                    <span className="text-[11px] text-amber-700 shrink-0">
                      {r.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Global error message */}
      {activeError && (
        <p className="text-xs text-rose-600 font-medium mt-0.5" role="alert">
          {activeError}
        </p>
      )}
    </div>
  );
}
