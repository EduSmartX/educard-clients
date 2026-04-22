/**
 * Subject Filter Configuration
 * Filter fields specific to subjects list
 */

import { FilterField } from './FilterModal';
import {
  makeDeletedToggle,
  getDeletedLabel,
  type FilterLabel,
} from './SharedFilterFields';

export const SUBJECT_FILTER_FIELDS: FilterField[] = [
  {
    name: 'subject_type',
    label: 'Subject Type',
    type: 'select',
    icon: '📚',
    options: [
      { value: '', label: 'All Types' },
      { value: 'core', label: '📖 Core' },
      { value: 'elective', label: '🎯 Elective' },
      { value: 'language', label: '🗣️ Language' },
    ],
  },
  makeDeletedToggle('subjects'),
];

export function getSubjectFilterLabels(filters: Record<string, any>): FilterLabel[] {
  const result: FilterLabel[] = [];

  if (filters.subject_type) {
    result.push({
      key: 'subject_type',
      label: filters.subject_type.charAt(0).toUpperCase() + filters.subject_type.slice(1),
      value: filters.subject_type,
    });
  }

  const deleted = getDeletedLabel(filters);
  if (deleted) result.push(deleted);

  return result;
}
