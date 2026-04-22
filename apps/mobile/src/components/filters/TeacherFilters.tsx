/**
 * Teacher Filter Configuration
 * Filter fields specific to teachers list
 */

import { FilterField } from './FilterModal';
import {
  GENDER_FILTER_FIELD,
  makeDeletedToggle,
  getGenderLabel,
  getDeletedLabel,
  type FilterLabel,
} from './SharedFilterFields';

export const TEACHER_FILTER_FIELDS: FilterField[] = [
  {
    name: 'designation',
    label: 'Designation',
    type: 'select',
    icon: '💼',
    options: [
      { value: '', label: 'All Designations' },
      { value: 'Senior Teacher', label: 'Senior Teacher' },
      { value: 'Junior Teacher', label: 'Junior Teacher' },
      { value: 'Head of Department', label: 'HOD' },
      { value: 'Principal', label: 'Principal' },
      { value: 'Vice Principal', label: 'Vice Principal' },
    ],
  },
  GENDER_FILTER_FIELD,
  makeDeletedToggle('teachers'),
];

export function getTeacherFilterLabels(filters: Record<string, any>): FilterLabel[] {
  const result: FilterLabel[] = [];

  if (filters.designation) {
    result.push({ key: 'designation', label: filters.designation, value: filters.designation });
  }

  const gender = getGenderLabel(filters);
  if (gender) result.push(gender);

  const deleted = getDeletedLabel(filters);
  if (deleted) result.push(deleted);

  return result;
}
