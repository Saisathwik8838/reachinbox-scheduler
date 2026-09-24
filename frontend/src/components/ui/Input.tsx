import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  sublabel?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      sublabel,
      error,
      leftIcon,
      rightAdornment,
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full text-sm bg-white border rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 
              transition-colors duration-150 outline-none
              ${leftIcon ? 'pl-9' : ''}
              ${rightAdornment ? 'pr-20' : ''}
              ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-100' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'}
              ${className}`}
            {...props}
          />
          {rightAdornment && (
            <div className="absolute right-3 text-xs text-slate-400 pointer-events-none select-none">
              {rightAdornment}
            </div>
          )}
        </div>
        {sublabel && !error && <span className="text-xs text-slate-400">{sublabel}</span>}
        {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
