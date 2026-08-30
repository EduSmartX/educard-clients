/**
 * Feedback Filter Configuration
 * Filter fields for the feedback submissions list — mirrors web app filters.
 */

import {
  FEEDBACK_MODULE_OPTIONS,
  FEEDBACK_STATUS,
  FEEDBACK_TYPE_OPTIONS,
} from '@educard/shared';

import type { FilterField } from './FilterModal';
import type { FilterLabel } from './SharedFilterFields';

export const FEEDBACK_FILTER_FIELDS: FilterField[] = [
  {
    name: 'feedback_type',
    label: 'Category',
    type: 'select',
    icon: '🏷️',
    options: [
      { value: '', label: 'All Categories' },
      ...FEEDBACK_TYPE_OPTIONS.map(option => ({
        value: option.value,
        label: option.label,
      })),
    ],
  },
  {
    name: 'module',
    label: 'Module',
    type: 'select',
    icon: '🧩',
    options: [
      { value: '', label: 'All Modules' },
      ...FEEDBACK_MODULE_OPTIONS.map(option => ({
        value: option.value,
        label: option.label,
      })),
    ],
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    icon: '📊',
    options: [
      { value: '', label: 'All Status' },
      { value: FEEDBACK_STATUS.OPEN, label: 'Open' },
      { value: FEEDBACK_STATUS.IN_PROGRESS, label: 'In Progress' },
      { value: FEEDBACK_STATUS.RESOLVED, label: 'Resolved' },
      { value: FEEDBACK_STATUS.CLOSED, label: 'Closed' },
    ],
  },
  { name: 'from_date', label: 'From Date', type: 'date', icon: '📅' },
  { name: 'to_date', label: 'To Date', type: 'date', icon: '📅' },
];

export function getFeedbackFilterLabels(
  filters: Record<string, unknown>,
): FilterLabel[] {
  const labels: FilterLabel[] = [];

  for (const field of FEEDBACK_FILTER_FIELDS) {
    const value = filters[field.name];
    if (!value) continue;

    const option = field.options?.find(item => item.value === value);
    labels.push({
      key: field.name,
      label: option?.label ?? String(value),
      value,
    });
  }

  return labels;
}
