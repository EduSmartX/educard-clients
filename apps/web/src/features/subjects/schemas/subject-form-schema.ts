/**
 * Subject Form Schema
 * Zod validation schema for subject forms
 */

import { z } from 'zod';

export const subjectFormSchema = z.object({
  class_id: z.string().min(1, 'Class is required'),
  subject_id: z
    .number({
      required_error: 'Subject is required',
      invalid_type_error: 'Subject is required',
    })
    .positive('Subject is required'),
  teacher_id: z.string().optional(),
  description: z.string().optional(),
});

export type SubjectFormData = z.infer<typeof subjectFormSchema>;
