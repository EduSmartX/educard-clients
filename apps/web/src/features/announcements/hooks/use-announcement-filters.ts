/**
 * Shared search/filter state for an announcements list.
 * Filter values are sent to the API; results are never filtered client-side.
 */

import { useEffect, useMemo, useState } from 'react';
import type { AnnouncementFilterParams } from '../api/announcements-api';
import type { AnnouncementStatus, DeliveryMethod, RecipientType } from '../types';

const SEARCH_DEBOUNCE_MS = 350;

export function useAnnouncementFilters(deliveryMethod: DeliveryMethod) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'all'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const hasActiveFilters =
    search.trim() !== '' ||
    recipientFilter !== 'all' ||
    statusFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  const queryFilters = useMemo<AnnouncementFilterParams>(
    () => ({
      search: debouncedSearch || undefined,
      delivery_methods: deliveryMethod,
      recipient_type: recipientFilter === 'all' ? undefined : recipientFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    }),
    [debouncedSearch, deliveryMethod, recipientFilter, statusFilter, fromDate, toDate]
  );

  const clearFilters = () => {
    setSearch('');
    setRecipientFilter('all');
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
  };

  return {
    search,
    setSearch,
    recipientFilter,
    setRecipientFilter,
    statusFilter,
    setStatusFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    hasActiveFilters,
    queryFilters,
    clearFilters,
  };
}
