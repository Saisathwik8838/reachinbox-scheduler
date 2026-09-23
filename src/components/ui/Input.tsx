import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightAddon?: string | React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightAddon,
      id,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full text-sm text-gray-900 bg-white border rounded-lg transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightAddon ? 'pr-24' : 'pr-3.5'} py-2.5 ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-300'
            } ${className}`}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-xs text-gray-400 select-none">
              {rightAddon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-rose-600 font-medium" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="mt-1 text-xs text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
