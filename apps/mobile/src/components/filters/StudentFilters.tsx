/**
 * Student Filter Configuration
 * Filter fields specific to students list — includes dynamic class filter
 */

import { useMemo } from 'react';
import { FilterField } from './FilterModal';
import {
  GENDER_FILTER_FIELD,
  makeDeletedToggle,
  getGenderLabel,
  getDeletedLabel,
  type FilterLabel,
} from './SharedFilterFields';
import { useClasses } from '@/features/classes';

/** Students backend uses `user__gender` instead of `gender` */
const STUDENT_GENDER_FIELD: FilterField = {
  ...GENDER_FILTER_FIELD,
  name: 'user__gender',
};

/** Static filter fields (no dynamic data) */
export const STUDENT_FILTER_FIELDS: FilterField[] = [
  STUDENT_GENDER_FIELD,
  makeDeletedToggle('students'),
];

/**
 * Hook that returns student filter fields WITH a dynamic class dropdown.
 * Use this instead of the static `STUDENT_FILTER_FIELDS` when you need class filtering.
 */
export function useStudentFilterFields(): FilterField[] {
  const { data: classesData } = useClasses({ page_size: 100 });

  return useMemo(() => {
    const classOptions = (classesData?.classes || []).map((c: any) => ({
      value: c.public_id,
      label: `${c.class_master?.name || ''} - ${c.name}`.trim(),
    }));

    const classField: FilterField = {
      name: 'class_id',
      label: 'Class',
      type: 'select',
      icon: '🏫',
      options: [
        { value: '', label: 'All Classes' },
        ...classOptions,
      ],
    };

    return [classField, STUDENT_GENDER_FIELD, makeDeletedToggle('students')];
  }, [classesData]);
}

export function getStudentFilterLabels(
  filters: Record<string, any>,
  classOptions?: { value: string; label: string }[],
): FilterLabel[] {
  const result: FilterLabel[] = [];

  // Class filter label
  if (filters.class_id && classOptions) {
    const cls = classOptions.find((c) => c.value === filters.class_id);
    if (cls) result.push({ key: 'class_id', label: `Class: ${cls.label}`, value: filters.class_id });
  } else if (filters.class_id) {
    result.push({ key: 'class_id', label: 'Class filter', value: filters.class_id });
  }

  const gender = getGenderLabel(filters, 'user__gender');
  if (gender) result.push(gender);

  const deleted = getDeletedLabel(filters);
  if (deleted) result.push(deleted);

  return result;
}
