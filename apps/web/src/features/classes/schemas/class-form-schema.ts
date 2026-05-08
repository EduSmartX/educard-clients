/**
 * Class Form Validation Schema
 * Zod schemas for class form validation
 */

import { z } from 'zod';

/**
 * Class Form Schema
 * Used for create and update operations
 */
export const classFormSchema = z.object({
  // Required fields
  class_master: z.string().min(1, 'Class is required'),
  name: z.string().min(1, 'Section name is required'),

  // Optional fields
  class_teacher: z.string().optional(),
  info: z.string().optional(),
  room_number: z.string().optional(),
  capacity: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), 'Capacity must be a valid number')
    .refine((val) => !val || parseInt(val) > 0, 'Capacity must be greater than 0'),
});

export type ClassFormData = z.infer<typeof classFormSchema>;

/**
 * Validation rules for onBlur validation
 */
export const classFieldValidations = {
  class_master: {
    required: true,
    message: 'Class is required',
  },
  name: {
    required: true,
    message: 'Section name is required',
  },
  capacity: {
    pattern: /^\d+$/,
    message: 'Capacity must be a valid number',
  },
};
