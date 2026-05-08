/**
 * Leave Request Form Validation Schema
 */
import { z } from 'zod';

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export const leaveRequestFormSchema = z
  .object({
    leave_balance: z.string().min(1, 'Please select a leave type'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    is_half_day: z.boolean().optional().default(false),
    number_of_days: z.number().min(0.5, 'Number of days must be at least 0.5'),
    reason: z
      .string()
      .min(1, 'Reason is required')
      .max(500, 'Reason must not exceed 500 characters'),
    attachment: z
      .instanceof(File)
      .optional()
      .nullable()
      .refine((file) => !file || file.size <= MAX_ATTACHMENT_SIZE, 'File size must be 5 MB or less')
      .refine(
        (file) => !file || ALLOWED_ATTACHMENT_TYPES.includes(file.type),
        'Only PDF, JPEG, PNG, or WebP files are allowed'
      ),
    remove_attachment: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: 'End date must be on or after start date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    },
    {
      message: 'Date range cannot exceed 30 days. Please submit separate leave requests.',
      path: ['end_date'],
    }
  );

export type LeaveRequestFormData = z.infer<typeof leaveRequestFormSchema>;
