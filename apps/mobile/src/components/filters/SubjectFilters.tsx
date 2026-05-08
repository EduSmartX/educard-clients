/**
 * Subject Filter Configuration
 * Filter fields specific to subjects list
 */

import { FilterField } from './FilterModal';
import { makeDeletedToggle, getDeletedLabel, type FilterLabel } from './SharedFilterFields';

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

export function getSubjectFilterLabels(filters: Record<string, unknown>): FilterLabel[] {
  const result: FilterLabel[] = [];

  const subjectType = filters.subject_type;
  if (typeof subjectType === 'string' && subjectType) {
    const label = subjectType.charAt(0).toUpperCase() + subjectType.slice(1);
    result.push({
      key: 'subject_type',
      label,
      value: subjectType,
    });
  }

  const deleted = getDeletedLabel(filters);
  if (deleted) result.push(deleted);

  return result;
}
