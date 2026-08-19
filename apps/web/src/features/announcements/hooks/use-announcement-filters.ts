/**
 * Shared search/filter state for an announcements list (used by the
 * Email / SMS / Both announcement pages).
 */

import { useMemo, useState } from 'react';
import type { AnnouncementListItem, AnnouncementStatus, RecipientType } from '../types';

export function useAnnouncementFilters(items: AnnouncementListItem[]) {
  const [search, setSearch] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<RecipientType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | 'all'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const hasActiveFilters =
    search.trim() !== '' ||
    recipientFilter !== 'all' ||
    statusFilter !== 'all' ||
    fromDate !== '' ||
    toDate !== '';

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (
        q &&
        !item.subject.toLowerCase().includes(q) &&
        !item.event_name.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (recipientFilter !== 'all' && item.recipient_type !== recipientFilter) {
        return false;
      }
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      const when = (item.sent_at ?? item.created_at)?.slice(0, 10);
      if (fromDate && when && when < fromDate) {
        return false;
      }
      if (toDate && when && when > toDate) {
        return false;
      }
      return true;
    });
  }, [items, search, recipientFilter, statusFilter, fromDate, toDate]);

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
    filteredItems,
    clearFilters,
  };
}
