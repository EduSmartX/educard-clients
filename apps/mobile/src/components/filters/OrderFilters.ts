/**
 * Store order filters - same names as the web page and the API: status (several),
 * product, placed_from / placed_to (YYYY-MM-DD). The order number search box sits
 * above the list.
 */

import type { OrderFilterOptions, OrderQueryParams } from '@educard/shared';

import type { FilterField } from './FilterModal';
import type { FilterLabel } from './SharedFilterFields';

export interface OrderFiltersState {
  status?: string[];
  /** Product codes: every product in the school's store (its own names). */
  product?: string[];
  placed_from?: string;
  placed_to?: string;
}

export function buildOrderFilterFields(
  options?: OrderFilterOptions,
): FilterField[] {
  return [
    {
      name: 'status',
      label: 'Status',
      type: 'multiselect',
      icon: '📦',
      options: options?.statuses ?? [],
    },
    {
      name: 'product',
      label: 'Products',
      type: 'multiselect',
      display: 'dropdown',
      icon: '🛍️',
      placeholder: 'All products',
      options: options?.products ?? [],
    },
    {
      name: 'placed_from',
      label: 'Placed from',
      type: 'date',
      icon: '📅',
      placeholder: 'Any date',
    },
    {
      name: 'placed_to',
      label: 'Placed to',
      type: 'date',
      icon: '📅',
      placeholder: 'Any date',
    },
  ];
}

/** The API query for these filters (statuses comma-separated). */
export function orderFilterParams(
  filters: OrderFiltersState,
  search: string,
): OrderQueryParams {
  const params: OrderQueryParams = {};
  if (filters.status?.length) {
    params.status = filters.status.join(',');
  }
  if (filters.product?.length) {
    params.product = filters.product.join(',');
  }
  if (filters.placed_from) {
    params.placed_from = filters.placed_from;
  }
  if (filters.placed_to) {
    params.placed_to = filters.placed_to;
  }
  if (search.trim()) {
    params.search = search.trim();
  }
  return params;
}

/** One removable chip per filter in use. */
export function getOrderFilterLabels(
  filters: OrderFiltersState,
  options?: OrderFilterOptions,
): FilterLabel[] {
  const labelOf = (list: { value: string; label: string }[], value: string) =>
    list.find(option => option.value === value)?.label ?? value;
  const labels: FilterLabel[] = [];
  if (filters.status?.length) {
    labels.push({
      key: 'status',
      label: filters.status
        .map(value => labelOf(options?.statuses ?? [], value))
        .join(', '),
      value: filters.status,
    });
  }
  if (filters.product?.length) {
    labels.push({
      key: 'product',
      label: filters.product
        .map(value => labelOf(options?.products ?? [], value))
        .join(', '),
      value: filters.product,
    });
  }
  if (filters.placed_from) {
    labels.push({
      key: 'placed_from',
      label: `From ${filters.placed_from}`,
      value: filters.placed_from,
    });
  }
  if (filters.placed_to) {
    labels.push({
      key: 'placed_to',
      label: `To ${filters.placed_to}`,
      value: filters.placed_to,
    });
  }
  return labels;
}
