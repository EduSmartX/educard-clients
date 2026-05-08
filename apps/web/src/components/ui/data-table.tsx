/**
 * DataTable Component
 */

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortKey?: string; // Optional: custom key for sorting if different from display
  width?: number; // Optional: initial width in pixels
  minWidth?: number; // Optional: minimum width in pixels (default: 100)
  maxWidth?: number; // Optional: maximum width in pixels
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  count: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  getRowKey: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  maxHeight?: string; // Optional: maximum table height (default: 500px)
  minWidth?: string; // Optional: minimum table width (default: 1200px)
  // Pagination props
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found',
  emptyAction,
  getRowKey,
  onRowClick,
  maxHeight = '500px',
  minWidth = '1200px',
  pagination,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columnWidths, setColumnWidths] = useState<number[]>(
    columns.map((col) => col.width || 200)
  );
  const [resizingIndex, setResizingIndex] = useState<number | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Client-side sorting: Sort data based on selected column and direction
  const sortedData = [...data].sort((rowA, rowB) => {
    if (!sortField) {
      return 0;
    }

    // Find the column configuration
    const column = columns.find(
      (col) => (col.sortKey || col.header.toLowerCase().replace(/\s+/g, '_')) === sortField
    );

    if (!column || !column.sortable) {
      return 0;
    }

    let aValue: unknown;
    let bValue: unknown;

    // Get values based on accessor
    if (typeof column.accessor === 'function') {
      // For function accessors, use sortKey if provided
      const sortKey = column.sortKey as keyof T;
      aValue = sortKey ? rowA[sortKey] : '';
      bValue = sortKey ? rowB[sortKey] : '';
    } else {
      aValue = rowA[column.accessor];
      bValue = rowB[column.accessor];
    }

    // Handle null/undefined
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Convert to lowercase for string comparison
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    const normalizedA = aValue as string | number;
    const normalizedB = bValue as string | number;

    if (normalizedA < normalizedB) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (normalizedA > normalizedB) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Toggle sort: Click same column to flip direction, click new column to sort asc
  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const field = column.sortKey || column.header.toLowerCase().replace(/\s+/g, '_');

    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    const field = column.sortKey || column.header.toLowerCase().replace(/\s+/g, '_');

    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4 text-blue-600" />
    );
  };

  // Handle column resize
  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingIndex(index);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[index];
  };

  useEffect(() => {
    if (resizingIndex === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(
        columns[resizingIndex].minWidth || 100,
        Math.min(columns[resizingIndex].maxWidth || 600, startWidthRef.current + deltaX)
      );

      setColumnWidths((prev) => {
        const updated = [...prev];
        updated[resizingIndex] = newWidth;
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizingIndex(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingIndex, columns]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-gray-500">{emptyMessage}</p>
        {emptyAction && (
          <Button onClick={emptyAction.onClick} variant="outline">
            {emptyAction.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className="custom-scrollbar w-full overflow-auto relative"
        style={{
          maxHeight,
          paddingBottom: '4px',
        }}
      >
        <table className="w-full caption-bottom text-sm" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-100 to-gray-50 [&_tr]:border-b">
            <TableRow className="bg-gray-100 border-b-2 border-gray-300">
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={`relative border-r border-gray-300 bg-gray-100 font-bold text-gray-900 last:border-r-0 ${column.headerClassName || ''}`}
                  style={{
                    width: `${columnWidths[index]}px`,
                    minWidth: `${columnWidths[index]}px`,
                  }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column)}
                      className="flex items-center font-bold transition-colors hover:text-blue-600"
                    >
                      {column.header}
                      {getSortIcon(column)}
                    </button>
                  ) : (
                    <span className="font-bold">{column.header}</span>
                  )}
                  {/* Resize handle */}
                  <button
                    type="button"
                    aria-label="Resize column"
                    className="absolute top-0 right-0 h-full w-1 cursor-col-resize border-0 p-0 hover:bg-blue-400 active:bg-blue-500"
                    onMouseDown={(e) => handleResizeStart(index, e)}
                    style={{
                      backgroundColor: resizingIndex === index ? '#3b82f6' : 'transparent',
                    }}
                  />
                </TableHead>
              ))}
            </TableRow>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {sortedData.map((row, rowIndex) => (
              <TableRow
                key={getRowKey(row, rowIndex)}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className={`border-r border-gray-200 break-words last:border-r-0 ${column.className || ''}`}
                    style={{
                      width: `${columnWidths[colIndex]}px`,
                      maxWidth: `${columnWidths[colIndex]}px`,
                    }}
                  >
                    {typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : (row[column.accessor] as ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9ca3af #f3f4f6;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      {/* Pagination Controls - Always show when pagination data is available */}
      {pagination && (
        <div className="flex items-center justify-between border-t bg-gradient-to-r from-gray-50 to-white px-6 py-4 mt-4 rounded-b-lg">
          {/* Mobile pagination */}
          <div className="flex flex-1 justify-between gap-3 sm:hidden">
            <Button
              onClick={() => onPageChange?.(pagination.current_page - 1)}
              disabled={!pagination.has_previous}
              variant="outline"
              size="sm"
              className="rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              Previous
            </Button>
            <Button
              onClick={() => onPageChange?.(pagination.current_page + 1)}
              disabled={!pagination.has_next}
              variant="outline"
              size="sm"
              className="rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              Next
            </Button>
          </div>

          {/* Desktop pagination */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <p className="text-sm font-medium text-gray-700">
                Showing{' '}
                <span className="font-semibold text-blue-600">
                  {pagination.count === 0
                    ? 0
                    : (pagination.current_page - 1) * pagination.page_size + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-blue-600">
                  {Math.min(pagination.current_page * pagination.page_size, pagination.count)}
                </span>{' '}
                of <span className="font-semibold text-blue-600">{pagination.count}</span> results
              </p>

              {/* Page size selector */}
              {onPageSizeChange && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="page-size"
                    className="text-sm font-medium text-gray-700 whitespace-nowrap"
                  >
                    Per page:
                  </label>
                  <select
                    id="page-size"
                    value={pagination.page_size}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              )}
            </div>

            <nav className="isolate inline-flex gap-1 rounded-lg" aria-label="Pagination">
              {/* Previous button */}
              <button
                onClick={() => onPageChange?.(pagination.current_page - 1)}
                disabled={!pagination.has_previous}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 bg-white border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all shadow-sm hover:shadow-md"
                aria-label="Previous page"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Page numbers */}
              {renderPageNumbers(pagination, onPageChange)}

              {/* Next button */}
              <button
                onClick={() => onPageChange?.(pagination.current_page + 1)}
                disabled={!pagination.has_next}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 bg-white border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all shadow-sm hover:shadow-md"
                aria-label="Next page"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to render page numbers with ellipsis
function renderPageNumbers(pagination: PaginationInfo, onPageChange?: (page: number) => void) {
  const { current_page, total_pages } = pagination;
  const pages: (number | string)[] = [];

  if (total_pages <= 7) {
    // Show all pages if 7 or less
    for (let i = 1; i <= total_pages; i++) {
      pages.push(i);
    }
  } else {
    // Show first page
    pages.push(1);

    if (current_page > 3) {
      pages.push('...');
    }

    // Show pages around current page
    const start = Math.max(2, current_page - 1);
    const end = Math.min(total_pages - 1, current_page + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current_page < total_pages - 2) {
      pages.push('...');
    }

    // Show last page
    pages.push(total_pages);
  }

  return pages.map((page, index) => {
    if (page === '...') {
      return (
        <span
          key={`ellipsis-${index}`}
          className="relative inline-flex items-center justify-center w-10 h-10 text-sm font-semibold text-gray-500"
        >
          ...
        </span>
      );
    }

    const pageNum = page as number;
    const isCurrentPage = pageNum === current_page;

    return (
      <button
        key={pageNum}
        onClick={() => onPageChange?.(pageNum)}
        className={`relative inline-flex items-center justify-center w-10 h-10 text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md focus:z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isCurrentPage
            ? 'z-10 bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 shadow-md'
            : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
        }`}
        aria-current={isCurrentPage ? 'page' : undefined}
      >
        {pageNum}
      </button>
    );
  });
}
