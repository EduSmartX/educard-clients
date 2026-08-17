import { z } from 'zod';
import {
  FEEDBACK_ALLOWED_MIME_TYPES,
  FEEDBACK_DESCRIPTION_MAX_LENGTH,
  FEEDBACK_MAX_ATTACHMENTS,
  FEEDBACK_MAX_ATTACHMENT_SIZE,
  FEEDBACK_MAX_RATING,
  FEEDBACK_MIN_RATING,
  FEEDBACK_MODULE,
  FEEDBACK_SUBJECT_MAX_LENGTH,
  FEEDBACK_TYPE,
} from '@educard/shared';

const feedbackTypeValues = Object.values(FEEDBACK_TYPE) as [string, ...string[]];
const feedbackModuleValues = Object.values(FEEDBACK_MODULE) as [string, ...string[]];

export const feedbackFormSchema = z.object({
  feedback_type: z.enum(feedbackTypeValues, {
    errorMap: () => ({ message: 'Please choose a feedback type' }),
  }),
  module: z.union([z.enum(feedbackModuleValues), z.literal('')]).optional(),
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .max(
      FEEDBACK_SUBJECT_MAX_LENGTH,
      `Subject must be ${FEEDBACK_SUBJECT_MAX_LENGTH} characters or less`
    ),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(
      FEEDBACK_DESCRIPTION_MAX_LENGTH,
      `Description must be ${FEEDBACK_DESCRIPTION_MAX_LENGTH} characters or less`
    ),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

export const reviewFormSchema = z.object({
  rating: z
    .number({ invalid_type_error: 'Please select a rating' })
    .int()
    .min(FEEDBACK_MIN_RATING, 'Please select a rating')
    .max(FEEDBACK_MAX_RATING, 'Please select a rating'),
  review: z.string().trim().max(FEEDBACK_DESCRIPTION_MAX_LENGTH).optional(),
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;

/** Mirrors the backend attachment rules so the user sees failures before uploading. */
export function validateAttachment(file: File): string | null {
  if (file.size > FEEDBACK_MAX_ATTACHMENT_SIZE) {
    return `${file.name} is larger than ${FEEDBACK_MAX_ATTACHMENT_SIZE / (1024 * 1024)} MB`;
  }
  if (!(FEEDBACK_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name} is not a supported file type`;
  }
  return null;
}

export const FEEDBACK_ATTACHMENT_ACCEPT: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export const FEEDBACK_ATTACHMENT_HELPER_TEXT = `Up to ${FEEDBACK_MAX_ATTACHMENTS} files, ${
  FEEDBACK_MAX_ATTACHMENT_SIZE / (1024 * 1024)
} MB each. PDF, JPEG, PNG or WebP.`;
