/**
 * Student bulk upload column configuration
 * Matches backend StudentColumns from edusphere/students/constants.py
 */

import type { ColumnConfig, DuplicateCheckConfig } from './excel-validator';
import {
  classNameValidator,
  requiredValidator,
  rollNumberValidator,
  optionalEmailValidator,
  supervisorEmailValidator,
  phoneValidator,
  optionalTextValidator,
  dateValidator,
  genderValidator,
  bloodGroupValidator,
} from './field-validators';

/**
 * Student column configurations
 * These match the backend StudentColumns class
 */
export const STUDENT_COLUMNS: ColumnConfig[] = [
  // === MANDATORY FIELDS ===
  {
    key: 'class_name',
    name: 'Class',
    required: true,
    description: "Full class name (e.g., 'Grade 1_Section A', 'Grade 2_Section B')",
    validator: classNameValidator,
  },
  {
    key: 'first_name',
    name: 'First Name',
    required: true,
    description: "Student's first name",
    validator: requiredValidator(50),
  },
  {
    key: 'last_name',
    name: 'Last Name',
    required: true,
    description: "Student's last name",
    validator: requiredValidator(50),
  },
  {
    key: 'roll_number',
    name: 'Roll Number',
    required: true,
    description: "Student's roll number within the class",
    validator: rollNumberValidator,
  },
  // === OPTIONAL FIELDS ===
  {
    key: 'email',
    name: 'Email',
    required: false,
    description: "Student's email address (must be unique if provided) (Optional)",
    validator: optionalEmailValidator,
  },
  {
    key: 'supervisor_email',
    name: 'Supervisor Email',
    required: false,
    description:
      'Supervisor from dropdown (Class Teacher listed first, then other teachers alphabetically). Defaults to Class Teacher if not provided (Optional)',
    validator: supervisorEmailValidator,
  },
  {
    key: 'phone_number',
    name: 'Phone Number',
    required: false,
    description: "Student's phone number (Optional)",
    validator: phoneValidator,
  },
  {
    key: 'admission_number',
    name: 'Admission Number',
    required: false,
    description: "Student's unique admission number (Optional)",
    validator: optionalTextValidator(50),
  },
  {
    key: 'admission_date',
    name: 'Admission Date (YYYY-MM-DD)',
    required: false,
    description: 'Date of admission in YYYY-MM-DD format (e.g., 2024-01-15) (Optional)',
    validator: dateValidator({ maxFutureMonths: 6, format: 'YYYY-MM-DD' }),
  },
  {
    key: 'date_of_birth',
    name: 'Date of Birth (YYYY-MM-DD)',
    required: false,
    description: "Student's date of birth in YYYY-MM-DD format (e.g., 2010-05-20) (Optional)",
    validator: dateValidator({ notInFuture: true, minAge: 3, format: 'YYYY-MM-DD' }),
  },
  {
    key: 'gender',
    name: 'Gender (M/F/O)',
    required: false,
    description: "Student's gender: M (Male), F (Female), or O (Other) (Optional)",
    validator: genderValidator,
  },
  {
    key: 'blood_group',
    name: 'Blood Group',
    required: false,
    description: "Student's blood group: A+, A-, B+, B-, O+, O-, AB+, AB- (Optional)",
    validator: bloodGroupValidator,
  },
  {
    key: 'guardian_name',
    name: 'Guardian Name',
    required: false,
    description: "Guardian's full name (Optional)",
    validator: optionalTextValidator(100),
  },
  {
    key: 'guardian_relationship',
    name: 'Guardian Relationship',
    required: false,
    description: 'Relationship with guardian (e.g., Father, Mother, Uncle) (Optional)',
    validator: optionalTextValidator(50),
  },
  {
    key: 'medical_conditions',
    name: 'Medical Conditions',
    required: false,
    description: 'Any medical conditions or allergies (Optional)',
    validator: optionalTextValidator(500),
  },
];

/**
 * Student duplicate check configurations
 */
export const STUDENT_DUPLICATE_CHECKS: DuplicateCheckConfig[] = [
  {
    fields: ['class_name', 'roll_number'],
    composite: true,
    label: 'Roll Number in Class',
  },
  {
    fields: ['admission_number'],
    composite: false,
    label: 'Admission Number',
  },
];

/**
 * Get column config by field key
 */
export function getStudentColumnByKey(key: string): ColumnConfig | undefined {
  return STUDENT_COLUMNS.find((col) => col.key === key);
}

/**
 * Get mandatory student columns
 */
export function getMandatoryStudentColumns(): ColumnConfig[] {
  return STUDENT_COLUMNS.filter((col) => col.required);
}

/**
 * Get optional student columns
 */
export function getOptionalStudentColumns(): ColumnConfig[] {
  return STUDENT_COLUMNS.filter((col) => !col.required);
}
