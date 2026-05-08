/**
 * Class bulk upload column configuration
 * Matches backend ClassColumns from edusphere/classes/constants.py
 */

import type { ColumnConfig, DuplicateCheckConfig } from './excel-validator';
import {
  requiredValidator,
  optionalTextValidator,
  positiveIntegerValidator,
  teacherInfoValidator,
} from './field-validators';

/**
 * Class column configurations
 * These match the backend ClassColumns class
 */
export const CLASS_COLUMNS: ColumnConfig[] = [
  // === MANDATORY FIELDS ===
  {
    key: 'class_master',
    name: "Class/Grade (e.g., 'Grade 1', 'Grade 2')",
    required: true,
    description: 'Class/Grade name from master data',
    validator: requiredValidator(100),
  },
  {
    key: 'name',
    name: "Section Name (e.g., 'A', 'B', 'Section 1')",
    required: true,
    description: 'Section name for the class',
    validator: requiredValidator(50),
  },
  // === OPTIONAL FIELDS ===
  {
    key: 'class_teacher',
    name: 'Class Teacher (Email)',
    required: false,
    description: 'Email address of the class teacher (Optional)',
    validator: teacherInfoValidator,
  },
  {
    key: 'capacity',
    name: 'Class Capacity',
    required: false,
    description: 'Maximum number of students allowed in the class (default: 50)',
    validator: positiveIntegerValidator({ min: 1, max: 500 }),
  },
  {
    key: 'info',
    name: 'Additional Information',
    required: false,
    description: 'Optional additional information about the class',
    validator: optionalTextValidator(500),
  },
];

/**
 * Class duplicate check configurations
 */
export const CLASS_DUPLICATE_CHECKS: DuplicateCheckConfig[] = [
  {
    fields: ['class_master', 'name'],
    composite: true,
    label: 'Class (Grade + Section)',
  },
];

/**
 * Get column config by field key
 */
export function getClassColumnByKey(key: string): ColumnConfig | undefined {
  return CLASS_COLUMNS.find(col => col.key === key);
}

/**
 * Get mandatory class columns
 */
export function getMandatoryClassColumns(): ColumnConfig[] {
  return CLASS_COLUMNS.filter(col => col.required);
}

/**
 * Get optional class columns
 */
export function getOptionalClassColumns(): ColumnConfig[] {
  return CLASS_COLUMNS.filter(col => !col.required);
}
