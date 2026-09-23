/**
 * Subject bulk upload column configuration
 * Matches backend SubjectColumns from edusphere/subjects/constants.py
 */

import type { ColumnConfig, DuplicateCheckConfig } from './excel-validator';
import {
  classNameValidator,
  requiredValidator,
  optionalTextValidator,
  teacherInfoValidator,
} from './field-validators';

/**
 * Subject column configurations
 * These match the backend SubjectColumns class
 */
export const SUBJECT_COLUMNS: ColumnConfig[] = [
  // === MANDATORY FIELDS ===
  {
    key: 'class_name',
    name: 'Class',
    required: true,
    description: "Full class name (e.g., 'Grade 1_Section A', 'Grade 2_Section B')",
    validator: classNameValidator,
  },
  {
    key: 'subject_name',
    name: 'Subject Name',
    required: true,
    description: "Subject name from master data (e.g., 'Mathematics', 'Science')",
    validator: requiredValidator(100),
  },
  // === OPTIONAL FIELDS ===
  {
    key: 'teacher_info',
    name: 'Teacher',
    required: false,
    description:
      "Teacher information in format: 'FirstName LastName (email@example.com)' (Optional)",
    validator: teacherInfoValidator,
  },
  {
    key: 'description',
    name: 'Description',
    required: false,
    description: 'Subject description (Optional)',
    validator: optionalTextValidator(500),
  },
];

/**
 * Subject duplicate check configurations
 */
export const SUBJECT_DUPLICATE_CHECKS: DuplicateCheckConfig[] = [
  {
    fields: ['class_name', 'subject_name'],
    composite: true,
    label: 'Subject in Class',
  },
];

/**
 * Get column config by field key
 */
export function getSubjectColumnByKey(key: string): ColumnConfig | undefined {
  return SUBJECT_COLUMNS.find((col) => col.key === key);
}

/**
 * Get mandatory subject columns
 */
export function getMandatorySubjectColumns(): ColumnConfig[] {
  return SUBJECT_COLUMNS.filter((col) => col.required);
}

/**
 * Get optional subject columns
 */
export function getOptionalSubjectColumns(): ColumnConfig[] {
  return SUBJECT_COLUMNS.filter((col) => !col.required);
}
