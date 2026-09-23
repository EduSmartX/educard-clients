/**
 * Filter state for an announcements list, driven by the shared ResourceFilter.
 * Every value is sent to the API; results are never filtered client-side.
 */

import { useMemo, useState } from 'react';
import type { AnnouncementFilterParams } from '../api/announcements-api';
import type { DeliveryMethod } from '../types';

export function useAnnouncementFilters(deliveryMethod?: DeliveryMethod) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  // A filter change must restart paging, otherwise page 3 of the old result set is requested.
  const applyFilters = (next: Record<string, string>) => {
    setFilters(next);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((value) => (value ?? '').trim() !== '');

  const queryFilters = useMemo<AnnouncementFilterParams>(
    () => ({
      search: filters.search || undefined,
      delivery_methods: deliveryMethod,
      recipient_type:
        (filters.recipient_type as AnnouncementFilterParams['recipient_type']) || undefined,
      status: (filters.status as AnnouncementFilterParams['status']) || undefined,
      from_date: filters.from_date || undefined,
      to_date: filters.to_date || undefined,
      page,
    }),
    [filters, deliveryMethod, page]
  );

  return {
    filters,
    applyFilters,
    resetFilters,
    hasActiveFilters,
    queryFilters,
    page,
    setPage,
  };
}
