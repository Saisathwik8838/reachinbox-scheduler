import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  sublabel?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, sublabel, className = '', containerClassName = '', id, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full text-sm bg-white border rounded-lg p-3 text-slate-900 placeholder:text-slate-400 
            transition-colors duration-150 outline-none resize-none
            ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'}
            ${className}`}
          {...props}
        />
        {sublabel && !error && <span className="text-xs text-slate-400">{sublabel}</span>}
        {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
