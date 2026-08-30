/**
 * Filter field definitions for feedback lists, built on the shared ResourceFilter
 * so feedback behaves like every other list page.
 */

import { FEEDBACK_MODULE_OPTIONS, FEEDBACK_STATUS, FEEDBACK_TYPE_OPTIONS } from '@educard/shared';
import type { FilterField } from '@/components/filters/resource-filter';

export const FEEDBACK_FILTER_FIELDS: FilterField[] = [
  {
    name: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search by ticket, subject or description...',
  },
  {
    name: 'feedback_type',
    label: 'Category',
    type: 'select',
    placeholder: 'All categories',
    options: FEEDBACK_TYPE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  },
  {
    name: 'module',
    label: 'Module',
    type: 'select',
    placeholder: 'All modules',
    options: FEEDBACK_MODULE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All status',
    options: [
      { value: FEEDBACK_STATUS.OPEN, label: 'Open' },
      { value: FEEDBACK_STATUS.IN_PROGRESS, label: 'In Progress' },
      { value: FEEDBACK_STATUS.RESOLVED, label: 'Resolved' },
      { value: FEEDBACK_STATUS.CLOSED, label: 'Closed' },
    ],
  },
  { name: 'from_date', label: 'From Date', type: 'date', placeholder: 'Select start date' },
  { name: 'to_date', label: 'To Date', type: 'date', placeholder: 'Select end date' },
];
