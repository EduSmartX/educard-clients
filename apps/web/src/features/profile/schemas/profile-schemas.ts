/**
 * Profile Form Schemas
 * Zod validation schemas for profile forms
 */

import { z } from 'zod';

/**
 * Profile Information Schema
 */
export const profileInformationSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  organization_role: z.string().optional(),
  gender: z.string().optional(),
  blood_group: z.string().optional(),
  date_of_birth: z.string().optional(),
  notification_opt_in: z.boolean(),
});

export type ProfileInformationFormData = z.infer<typeof profileInformationSchema>;

/**
 * Password Change Schema
 */
export const passwordChangeSchema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

/**
 * Address Update Schema
 */
export const addressUpdateSchema = z.object({
  street_address: z.string().min(1, 'Street address is required'),
  address_line_2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required'),
});

export type AddressUpdateFormData = z.infer<typeof addressUpdateSchema>;
