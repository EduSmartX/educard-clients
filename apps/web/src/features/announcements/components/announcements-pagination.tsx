/**
 * Pagination footer shared by the announcement lists.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '../api/announcements-api';

interface AnnouncementsPaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function AnnouncementsPagination({
  pagination,
  onPageChange,
}: Readonly<AnnouncementsPaginationProps>) {
  const { current_page, total_pages, count, page_size, has_next, has_previous } = pagination;

  if (count === 0) {
    return null;
  }

  const first = (current_page - 1) * page_size + 1;
  const last = Math.min(current_page * page_size, count);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Showing {first}–{last} of {count}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!has_previous}
          onClick={() => onPageChange(current_page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {current_page} of {total_pages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!has_next}
          onClick={() => onPageChange(current_page + 1)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
