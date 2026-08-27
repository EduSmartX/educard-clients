/**
 * Student Filter Configuration
 * Filter fields specific to students list — includes dynamic class filter
 */

import { useMemo } from 'react';

import { useClasses } from '@/features/classes/hooks/use-classes';

import { FilterField } from './FilterModal';
import {
  GENDER_FILTER_FIELD,
  makeDeletedToggle,
  getGenderLabel,
  getDeletedLabel,
  type FilterLabel,
} from './SharedFilterFields';

/** Students backend uses `user__gender` instead of `gender` */
const STUDENT_GENDER_FIELD: FilterField = {
  ...GENDER_FILTER_FIELD,
  name: 'user__gender',
};

const ADMISSION_DATE_FIELDS: FilterField[] = [
  {
    name: 'admission_date_from',
    label: 'Admission Date From',
    type: 'date',
    icon: '📅',
    placeholder: 'Start date',
  },
  {
    name: 'admission_date_to',
    label: 'Admission Date To',
    type: 'date',
    icon: '📅',
    placeholder: 'End date',
  },
];

/** Static filter fields (no dynamic data) */
export const STUDENT_FILTER_FIELDS: FilterField[] = [
  STUDENT_GENDER_FIELD,
  ...ADMISSION_DATE_FIELDS,
  makeDeletedToggle('students'),
];

/**
 * Hook that returns student filter fields WITH a dynamic class dropdown.
 * Use this instead of the static `STUDENT_FILTER_FIELDS` when you need class filtering.
 */
export function useStudentFilterFields(): FilterField[] {
  const { data: classesData } = useClasses({ page_size: 100 });

  return useMemo(() => {
    const classOptions = (classesData?.classes ?? []).map(c => ({
      value: c.public_id,
      label: `${c.class_master?.name ?? ''} - ${c.name}`.trim(),
    }));

    const classField: FilterField = {
      name: 'class_id',
      label: 'Class',
      type: 'select',
      icon: '🏫',
      options: [{ value: '', label: 'All Classes' }, ...classOptions],
    };

    return [
      classField,
      STUDENT_GENDER_FIELD,
      ...ADMISSION_DATE_FIELDS,
      makeDeletedToggle('students'),
    ];
  }, [classesData]);
}

export function getStudentFilterLabels(
  filters: Record<string, unknown>,
  classOptions?: { value: string; label: string }[],
): FilterLabel[] {
  const result: FilterLabel[] = [];

  // Class filter label
  const classId = filters.class_id as string | undefined;
  if (classId && classOptions) {
    const cls = classOptions.find(c => c.value === classId);
    if (cls)
      result.push({
        key: 'class_id',
        label: `Class: ${cls.label}`,
        value: classId,
      });
  } else if (classId) {
    result.push({ key: 'class_id', label: 'Class filter', value: classId });
  }

  const gender = getGenderLabel(filters, 'user__gender');
  if (gender) result.push(gender);

  const admissionFrom = filters.admission_date_from as string | undefined;
  if (admissionFrom) {
    result.push({
      key: 'admission_date_from',
      label: `Admitted from: ${admissionFrom}`,
      value: admissionFrom,
    });
  }

  const admissionTo = filters.admission_date_to as string | undefined;
  if (admissionTo) {
    result.push({
      key: 'admission_date_to',
      label: `Admitted to: ${admissionTo}`,
      value: admissionTo,
    });
  }

  const deleted = getDeletedLabel(filters);
  if (deleted) result.push(deleted);

  return result;
}
