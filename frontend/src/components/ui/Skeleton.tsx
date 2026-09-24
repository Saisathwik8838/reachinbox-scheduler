import React from 'react';

interface SkeletonProps {
  className?: string;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', circle = false }) => {
  return (
    <div
      className={`bg-slate-100 animate-pulse ${circle ? 'rounded-full' : 'rounded'} ${className}`}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 9 }) => {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
          {/* Recipient */}
          <div className="flex items-center gap-3 w-1/4">
            <Skeleton circle className="w-7 h-7 shrink-0" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Subject */}
          <div className="w-2/5">
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Time */}
          <div className="w-1/5">
            <Skeleton className="h-4 w-28" />
          </div>

          {/* Status Badge */}
          <div className="w-1/6 flex justify-end">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
