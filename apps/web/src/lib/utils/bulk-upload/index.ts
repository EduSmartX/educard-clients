/**
 * Bulk upload validation utilities
 * Common utilities for validating Excel files for bulk uploads
 */

// Core validator and types
export {
  validateExcelFile,
  formatValidationErrors,
  type ColumnConfig,
  type ValidationResult,
  type DuplicateCheckConfig,
  type ExcelValidationOptions,
  type ValidationError,
  type FieldValidator,
} from './excel-validator';

// Field validators
export {
  requiredValidator,
  optionalTextValidator,
  emailValidator,
  optionalEmailValidator,
  supervisorEmailValidator,
  phoneValidator,
  dateValidator,
  genderValidator,
  requiredGenderValidator,
  bloodGroupValidator,
  positiveIntegerValidator,
  classNameValidator,
  rollNumberValidator,
  teacherInfoValidator,
} from './field-validators';

// Student columns
export {
  STUDENT_COLUMNS,
  STUDENT_DUPLICATE_CHECKS,
  getStudentColumnByKey,
  getMandatoryStudentColumns,
  getOptionalStudentColumns,
} from './student-columns';

// Teacher columns
export {
  TEACHER_COLUMNS,
  TEACHER_DUPLICATE_CHECKS,
  getTeacherColumnByKey,
  getMandatoryTeacherColumns,
  getOptionalTeacherColumns,
} from './teacher-columns';

// Class columns
export {
  CLASS_COLUMNS,
  CLASS_DUPLICATE_CHECKS,
  getClassColumnByKey,
  getMandatoryClassColumns,
  getOptionalClassColumns,
} from './class-columns';

// Subject columns
export {
  SUBJECT_COLUMNS,
  SUBJECT_DUPLICATE_CHECKS,
  getSubjectColumnByKey,
  getMandatorySubjectColumns,
  getOptionalSubjectColumns,
} from './subject-columns';

// Convenience functions for entity-specific validation
import { validateExcelFile, type ValidationResult } from './excel-validator';
import { STUDENT_COLUMNS, STUDENT_DUPLICATE_CHECKS } from './student-columns';
import { TEACHER_COLUMNS, TEACHER_DUPLICATE_CHECKS } from './teacher-columns';
import { CLASS_COLUMNS, CLASS_DUPLICATE_CHECKS } from './class-columns';
import { SUBJECT_COLUMNS, SUBJECT_DUPLICATE_CHECKS } from './subject-columns';

/**
 * Validate a student Excel file
 */
export function validateStudentExcelFile(file: File): Promise<ValidationResult> {
  return validateExcelFile(file, {
    columns: STUDENT_COLUMNS,
    duplicateChecks: STUDENT_DUPLICATE_CHECKS,
    skipRows: 2, // Header + description
  });
}

/**
 * Validate a teacher Excel file
 */
export function validateTeacherExcelFile(file: File): Promise<ValidationResult> {
  return validateExcelFile(file, {
    columns: TEACHER_COLUMNS,
    duplicateChecks: TEACHER_DUPLICATE_CHECKS,
    skipRows: 2,
  });
}

/**
 * Validate a class Excel file
 */
export function validateClassExcelFile(file: File): Promise<ValidationResult> {
  return validateExcelFile(file, {
    columns: CLASS_COLUMNS,
    duplicateChecks: CLASS_DUPLICATE_CHECKS,
    skipRows: 2,
  });
}

/**
 * Validate a subject Excel file
 */
export function validateSubjectExcelFile(file: File): Promise<ValidationResult> {
  return validateExcelFile(file, {
    columns: SUBJECT_COLUMNS,
    duplicateChecks: SUBJECT_DUPLICATE_CHECKS,
    skipRows: 2,
  });
}
