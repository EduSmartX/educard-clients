/**
 * Filter field definitions for the announcement lists, built on the shared
 * ResourceFilter so announcements behave like every other list page.
 */

import type { FilterField } from '@/components/filters/resource-filter';
import { RECIPIENT_TYPE_OPTIONS } from '../types';

const SEARCH_FIELD: FilterField = {
  name: 'search',
  label: 'Search',
  type: 'text',
  placeholder: 'Search by subject or event...',
};

const DATE_FIELDS: FilterField[] = [
  { name: 'from_date', label: 'From Date', type: 'date', placeholder: 'Select start date' },
  { name: 'to_date', label: 'To Date', type: 'date', placeholder: 'Select end date' },
];

/** Recipients cannot see delivery internals, so only search and dates apply. */
export const RECIPIENT_FILTER_FIELDS: FilterField[] = [SEARCH_FIELD, ...DATE_FIELDS];

export const ADMIN_FILTER_FIELDS: FilterField[] = [
  SEARCH_FIELD,
  {
    name: 'recipient_type',
    label: 'Recipients',
    type: 'select',
    placeholder: 'All recipients',
    options: [...RECIPIENT_TYPE_OPTIONS],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All status',
    options: [
      { value: 'sent', label: 'Sent' },
      { value: 'failed', label: 'Failed' },
      { value: 'draft', label: 'Draft' },
    ],
  },
  ...DATE_FIELDS,
];
