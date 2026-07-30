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

/** Build subject filter fields with a dynamic class dropdown (options supplied by the caller). */
export function buildSubjectFilterFields(
  classOptions: { value: string; label: string }[],
): FilterField[] {
  const classField: FilterField = {
    name: 'class_assigned',
    label: 'Class',
    type: 'select',
    icon: '🏫',
    options: [{ value: '', label: 'All Classes' }, ...classOptions],
  };
  return [classField, ...SUBJECT_FILTER_FIELDS];
}

export function getSubjectFilterLabels(
  filters: Record<string, unknown>,
  classOptions?: { value: string; label: string }[],
): FilterLabel[] {
  const result: FilterLabel[] = [];

  const classAssigned = filters.class_assigned as string | undefined;
  if (classAssigned && classOptions) {
    const cls = classOptions.find(c => c.value === classAssigned);
    if (cls) {
      result.push({
        key: 'class_assigned',
        label: `Class: ${cls.label}`,
        value: classAssigned,
      });
    }
  } else if (classAssigned) {
    result.push({
      key: 'class_assigned',
      label: 'Class filter',
      value: classAssigned,
    });
  }

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
