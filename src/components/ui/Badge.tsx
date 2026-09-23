import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'solid-blue';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  className = '',
  ...props
}: BadgeProps): React.ReactElement {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium gap-1.5',
    md: 'text-xs px-2.5 py-1 font-medium gap-1.5',
  };

  const variantStyles = {
    neutral: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border border-amber-100',
    red: 'bg-rose-50 text-rose-700 border border-rose-100',
    'solid-blue': 'bg-blue-600 text-white shadow-xs',
  };

  const dotColor = {
    neutral: 'bg-gray-400',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-rose-500',
    'solid-blue': 'bg-white',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor[variant]} ${
            pulse ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
      )}
      {icon}
      <span>{children}</span>
    </span>
  );
}
