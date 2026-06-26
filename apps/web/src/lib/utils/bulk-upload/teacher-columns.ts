/**
 * Teacher bulk upload column configuration
 * Matches backend TeacherColumns from edusphere/teacher/constants.py
 */

import type { ColumnConfig, DuplicateCheckConfig } from './excel-validator';
import {
  requiredValidator,
  emailValidator,
  optionalTextValidator,
  phoneValidator,
  dateValidator,
  requiredGenderValidator,
  bloodGroupValidator,
  supervisorEmailValidator,
  positiveIntegerValidator,
} from './field-validators';

/**
 * Teacher column configurations
 * These match the backend TeacherColumns class
 */
export const TEACHER_COLUMNS: ColumnConfig[] = [
  // === MANDATORY FIELDS ===
  {
    key: 'first_name',
    name: 'First Name',
    required: true,
    description: "Teacher's first name",
    validator: requiredValidator(50),
  },
  {
    key: 'last_name',
    name: 'Last Name',
    required: true,
    description: "Teacher's last name",
    validator: requiredValidator(50),
  },
  {
    key: 'email',
    name: 'Email Address',
    required: true,
    description: "Teacher's email address",
    validator: emailValidator,
  },
  {
    key: 'employee_id',
    name: 'Employee ID',
    required: true,
    description: 'Unique employee identifier',
    validator: requiredValidator(50),
  },
  {
    key: 'organization_role',
    name: 'Organization Role',
    required: true,
    description:
      'Organization role name (e.g., Teacher, Head of Department, Principal). Defaults to Teacher if not provided.',
    validator: requiredValidator(100),
  },
  {
    key: 'gender',
    name: 'Gender (M/F/O)',
    required: true,
    description: 'Gender (Male/Female/Other)',
    validator: requiredGenderValidator,
  },
  // === OPTIONAL FIELDS ===
  {
    key: 'specialization',
    name: 'Specialization (Subject Code)',
    required: false,
    description: "Teacher's area of specialization",
    validator: optionalTextValidator(100),
  },
  {
    key: 'phone',
    name: 'Phone Number',
    required: false,
    description: 'Contact phone number',
    validator: phoneValidator,
  },
  {
    key: 'highest_qualification',
    name: 'Highest Qualification',
    required: false,
    description: 'Highest educational qualification',
    validator: optionalTextValidator(100),
  },
  {
    key: 'joining_date',
    name: 'Joining Date (DD-MM-YYYY)',
    required: false,
    description: 'Date of joining the organization in DD-MM-YYYY format (e.g., 15-01-2024)',
    validator: dateValidator({ maxFutureMonths: 6, format: 'DD-MM-YYYY' }),
  },
  {
    key: 'designation',
    name: 'Designation',
    required: false,
    description: 'Job designation or title',
    validator: optionalTextValidator(100),
  },
  {
    key: 'experience_years',
    name: 'Experience (Years)',
    required: false,
    description: 'Years of teaching experience',
    validator: positiveIntegerValidator({ min: 0, max: 60 }),
  },
  {
    key: 'subjects',
    name: 'Subjects (multiple selection)',
    required: false,
    description:
      'Select multiple subjects from dropdown and separate with commas (e.g., Mathematics, Science, English)',
    // No specific validator - backend handles subject validation
  },
  {
    key: 'date_of_birth',
    name: 'Date of Birth (DD-MM-YYYY)',
    required: false,
    description: "Teacher's date of birth in DD-MM-YYYY format (e.g., 20-05-1990)",
    validator: dateValidator({ notInFuture: true, minAge: 18, format: 'DD-MM-YYYY' }),
  },
  {
    key: 'blood_group',
    name: 'Blood Group (A+/A-/B+/B-/AB+/AB-/O+/O-)',
    required: false,
    description: 'Blood group',
    validator: bloodGroupValidator,
  },
  {
    key: 'supervisor_email',
    name: 'Supervisor Email',
    required: false,
    description:
      'Email of supervisor (any other teacher or admin). If not provided, defaults to Admin (Optional)',
    validator: supervisorEmailValidator,
  },
];

/**
 * Teacher duplicate check configurations
 */
export const TEACHER_DUPLICATE_CHECKS: DuplicateCheckConfig[] = [
  {
    fields: ['email'],
    composite: false,
    label: 'Email Address',
  },
  {
    fields: ['employee_id'],
    composite: false,
    label: 'Employee ID',
  },
];

/**
 * Get column config by field key
 */
export function getTeacherColumnByKey(key: string): ColumnConfig | undefined {
  return TEACHER_COLUMNS.find((col) => col.key === key);
}

/**
 * Get mandatory teacher columns
 */
export function getMandatoryTeacherColumns(): ColumnConfig[] {
  return TEACHER_COLUMNS.filter((col) => col.required);
}

/**
 * Get optional teacher columns
 */
export function getOptionalTeacherColumns(): ColumnConfig[] {
  return TEACHER_COLUMNS.filter((col) => !col.required);
}
