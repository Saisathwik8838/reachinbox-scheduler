import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/Table';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';

export interface ColumnDef<T> {
  key: string;
  header: string;
  width?: string;
  render: (item: T) => React.ReactNode;
}

export interface EmailTableProps<T> {
  data: T[] | undefined;
  columns: ColumnDef<T>[];
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry?: () => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
}

export function EmailTable<T extends { id: string }>({
  data,
  columns,
  isLoading,
  isFetching = false,
  isError,
  error,
  onRetry,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: EmailTableProps<T>): React.ReactElement {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isOutOfRange = total > 0 && page > totalPages;

  // Calculate pagination slice indicators
  const fromRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRecord = Math.min(page * pageSize, total);

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden flex flex-col">
      {/* Subtle Refetch Progress Bar (No layout shift) */}
      <div className="h-0.5 w-full bg-transparent overflow-hidden">
        {isFetching && !isLoading && (
          <div className="h-full bg-blue-600 animate-pulse w-full" />
        )}
      </div>

      {/* Main Table Structure */}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key} className={col.width}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {/* Initial Loading State: 9 skeleton rows matching column layout */}
          {isLoading &&
            Array.from({ length: 9 }).map((_, rowIndex) => (
              <TableRow key={`skeleton-row-${rowIndex}`}>
                {columns.map((col, colIndex) => (
                  <TableCell key={`skeleton-cell-${rowIndex}-${col.key}`}>
                    {colIndex === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circular" className="w-6 h-6 shrink-0" />
                        <Skeleton className="h-4 w-36 sm:w-44" />
                      </div>
                    ) : colIndex === 1 ? (
                      <Skeleton className="h-4 w-40 sm:w-60" />
                    ) : colIndex === 2 ? (
                      <Skeleton className="h-4 w-28 sm:w-32" />
                    ) : (
                      <Skeleton className="h-5 w-20 rounded-full" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {/* Normal Data Rows */}
          {!isLoading &&
            !isError &&
            data &&
            data.length > 0 &&
            data.map((item) => (
              <TableRow key={item.id}>
                {columns.map((col) => (
                  <TableCell key={`${item.id}-${col.key}`}>
                    {col.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>

      {/* Error State */}
      {!isLoading && isError && (
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3.5">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            Unable to load emails
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            {error?.message || 'Something went wrong. Please try again.'}
          </p>
          {onRetry && (
            <div className="mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State: First-time Empty */}
      {!isLoading && !isError && (!data || data.length === 0) && !isOutOfRange && (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      )}

      {/* Empty State: Out-of-bounds page range */}
      {!isLoading && !isError && isOutOfRange && (
        <EmptyState
          title="Page out of range"
          description={`Page ${page} does not exist. Total available pages: ${totalPages}.`}
          action={
            <Button variant="outline" size="sm" onClick={() => onPageChange(1)}>
              Return to first page
            </Button>
          }
        />
      )}

      {/* Footer / Pagination Controls */}
      {!isLoading && !isError && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3.5 border-t border-gray-100 bg-white text-xs text-gray-500 select-none">
          {/* Record range */}
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="font-semibold text-gray-700">{fromRecord}</span>–
              <span className="font-semibold text-gray-700">{toRecord}</span> of{' '}
              <span className="font-semibold text-gray-700">{total}</span>
            </span>

            {/* Page size dropdown */}
            {onPageSizeChange && (
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-gray-400">·</span>
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-transparent border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}
          </div>

          {/* Previous / Next buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
