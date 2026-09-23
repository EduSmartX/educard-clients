/**
 * Teacher Form Validation Schema
 * Zod schemas for teacher form validation using shared validators
 */

import { z } from 'zod';
import { GENDER_ENUM, BLOOD_GROUP_ENUM, ADDRESS_TYPE } from '@/constants';
import {
  emailSchema,
  phoneSchema,
  nameSchema,
  employeeIdSchema,
  dateSchema,
  numberSchema,
  textSchema,
} from '@/lib/utils/shared-zod-validators';

/**
 * Minimal Teacher Schema - Required fields only
 * Used for quick add mode
 * Matches Excel template required columns
 */
export const minimalTeacherSchema = z.object({
  employee_id: employeeIdSchema(true, 50),
  email: emailSchema(true),
  first_name: nameSchema('First name', true, 2, 100),
  last_name: nameSchema('Last name', true, 1, 100),
  gender: z.enum(GENDER_ENUM, {
    required_error: 'Gender is required',
    invalid_type_error: 'Please select a valid gender',
  }),
  organization_role: textSchema('Organization role', { required: true, maxLength: 50 }),
});

/**
 * Full Teacher Schema - All fields
 * Used for comprehensive form mode
 */
export const teacherFormSchema = z
  .object({
    // Required fields
    employee_id: employeeIdSchema(true, 50),
    email: emailSchema(true),
    first_name: nameSchema('First name', true, 2, 100),
    last_name: nameSchema('Last name', true, 1, 100),
    phone: phoneSchema(false),

    // Required user fields
    gender: z.enum(GENDER_ENUM, {
      required_error: 'Gender is required',
      invalid_type_error: 'Please select a valid gender',
    }),

    // Optional user fields
    blood_group: z.enum(BLOOD_GROUP_ENUM).optional(),
    date_of_birth: dateSchema('Date of birth', false),

    // Professional details
    organization_role: textSchema('Organization role', { required: true, maxLength: 50 }),
    supervisor_email: emailSchema(false),
    designation: textSchema('Designation', { maxLength: 100 }),
    highest_qualification: textSchema('Qualification', { maxLength: 200 }),
    specialization: textSchema('Specialization', { maxLength: 200 }),
    experience_years: numberSchema('Experience years', { min: 0, max: 70 }),
    joining_date: dateSchema('Joining date', false),

    // Subjects (array of subject IDs - integers from core subjects)
    subjects: z.array(z.coerce.number()).optional(),

    // Address fields
    address_type: z
      .enum([
        ADDRESS_TYPE.USER_CURRENT,
        ADDRESS_TYPE.USER_PERMANENT,
        ADDRESS_TYPE.ORGANIZATION,
      ] as const)
      .default(ADDRESS_TYPE.USER_CURRENT),
    street_address: textSchema('Street address', { maxLength: 255 }),
    address_line_2: textSchema('Address line 2', { maxLength: 255 }),
    city: textSchema('City', { maxLength: 100 }),
    state: textSchema('State', { maxLength: 100 }),
    postal_code: textSchema('Postal code', { maxLength: 20 }),
    country: textSchema('Country', { maxLength: 100 }),
  })
  .refine(
    (data) => {
      // If any address field is filled, all required address fields must be filled
      const hasAnyAddress =
        data.street_address || data.city || data.state || data.postal_code || data.country;

      if (hasAnyAddress) {
        return !!(
          data.street_address &&
          data.city &&
          data.state &&
          data.postal_code &&
          data.country
        );
      }

      return true;
    },
    {
      message:
        'If you provide address information, all address fields (except Address Line 2) are required',
      path: ['street_address'], // This will show the error on street_address field
    }
  );

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;
export type MinimalTeacherFormValues = z.infer<typeof minimalTeacherSchema>;
