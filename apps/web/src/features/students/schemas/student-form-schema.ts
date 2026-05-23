import { z } from 'zod';
import { GENDER_ENUM, BLOOD_GROUP_ENUM } from '@/constants';
import { createAddressSchema } from '@/components/form/address-schema';

const nameRegex = /^[a-zA-Z\s'-]+$/;
const alphanumericWithSymbolsRegex = /^[a-zA-Z0-9-_]+$/;

const phoneTransform = (val: string | undefined) => {
  if (!val) {
    return '';
  }
  return val.replace(/\D/g, '');
};

const uppercaseTransform = (val: string | undefined) => {
  if (!val) {
    return '';
  }
  return val.trim().toUpperCase();
};

const trimTransform = (val: string | undefined) => {
  if (!val) {
    return '';
  }
  return val.trim();
};

const lowercaseTransform = (val: string | undefined) => {
  if (!val) {
    return '';
  }
  return val.trim().toLowerCase();
};

export const studentFormSchema = z
  .object({
    // Basic Info (Required)
    first_name: z
      .string()
      .min(2, 'First name must be at least 2 characters')
      .max(100, 'First name must not exceed 100 characters')
      .regex(nameRegex, 'First name can only contain letters, spaces, hyphens, and apostrophes')
      .transform(trimTransform),

    last_name: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must not exceed 100 characters')
      .regex(nameRegex, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
      .transform(trimTransform),

    roll_number: z
      .string()
      .min(1, 'Roll number is required')
      .max(20, 'Roll number must not exceed 20 characters')
      .regex(
        alphanumericWithSymbolsRegex,
        'Roll number can only contain letters, numbers, hyphens, and underscores'
      )
      .transform(uppercaseTransform),

    class_id: z.string().min(1, 'Class is required'),

    // Contact Info (Optional)
    email: z
      .string()
      .max(255, 'Email must not exceed 255 characters')
      .email('Invalid email format')
      .transform(lowercaseTransform)
      .or(z.literal('')),

    phone: z
      .string()
      .transform(phoneTransform)
      .refine((val) => val === '' || /^\d{10}$/.test(val), {
        message: 'Phone number must be exactly 10 digits',
      })
      .or(z.literal('')),

    // Additional Info (Optional)
    admission_number: z
      .string()
      .max(50, 'Admission number must not exceed 50 characters')
      .regex(
        alphanumericWithSymbolsRegex,
        'Admission number can only contain letters, numbers, hyphens, and underscores'
      )
      .transform(uppercaseTransform)
      .or(z.literal('')),

    admission_date: z
      .string()
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          const date = new Date(val);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date <= today;
        },
        {
          message: 'Admission date cannot be in the future',
        }
      )
      .or(z.literal('')),

    gender: z.enum(GENDER_ENUM).or(z.literal('')),

    blood_group: z.enum(BLOOD_GROUP_ENUM).optional(),

    date_of_birth: z
      .string()
      .refine(
        (val) => {
          if (!val) {
            return true;
          }
          const dob = new Date(val);
          const today = new Date();
          const age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          const dayDiff = today.getDate() - dob.getDate();
          const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
          return actualAge >= 3 && actualAge <= 25;
        },
        {
          message: 'Student age must be between 3 and 25 years',
        }
      )
      .or(z.literal('')),

    supervisor_email: z
      .string()
      .email('Invalid email format')
      .transform(lowercaseTransform)
      .or(z.literal('')),

    // Guardian Info (Optional)
    guardian_name: z
      .string()
      .max(255, 'Guardian name must not exceed 255 characters')
      .or(z.literal('')),

    guardian_phone: z
      .string()
      .transform(phoneTransform)
      .refine((val) => val === '' || /^\d{10}$/.test(val), {
        message: 'Guardian phone must be exactly 10 digits',
      })
      .or(z.literal('')),

    guardian_email: z
      .string()
      .max(255, 'Guardian email must not exceed 255 characters')
      .email('Invalid email format')
      .transform(lowercaseTransform)
      .or(z.literal('')),

    guardian_relationship: z
      .string()
      .max(100, 'Relationship must not exceed 100 characters')
      .or(z.literal('')),

    // Medical & Additional Info (Optional)
    medical_conditions: z
      .string()
      .max(500, 'Medical conditions must not exceed 500 characters')
      .or(z.literal('')),

    description: z
      .string()
      .max(500, 'Description must not exceed 500 characters')
      .or(z.literal('')),

    // Previous School Info (Optional)
    previous_school_name: z
      .string()
      .max(255, 'Previous school name must not exceed 255 characters')
      .or(z.literal('')),

    previous_school_address: z
      .string()
      .max(500, 'Previous school address must not exceed 500 characters')
      .or(z.literal('')),

    previous_school_class: z
      .string()
      .max(50, 'Previous school class must not exceed 50 characters')
      .or(z.literal('')),

    // Address (Optional)
    ...createAddressSchema(false),
  })
  .superRefine((data, ctx) => {
    // Guardian contact validation: if name provided, phone OR email required
    if (data.guardian_name && !data.guardian_phone && !data.guardian_email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Guardian phone or email is required when guardian name is provided',
        path: ['guardian_phone'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Guardian phone or email is required when guardian name is provided',
        path: ['guardian_email'],
      });
    }

    // Self-supervision prevention: student email ≠ supervisor email
    if (data.email && data.supervisor_email && data.email === data.supervisor_email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Student cannot be their own supervisor',
        path: ['supervisor_email'],
      });
    }
  });

export type StudentFormData = z.infer<typeof studentFormSchema>;
