import * as z from 'zod';

export const workingDayPolicySchema = z
  .object({
    sunday_off: z.boolean(),
    saturday_off_pattern: z.string().min(1, 'Saturday pattern is required'),
    effective_from: z.date({
      required_error: 'Effective from date is required',
    }),
    effective_to: z.date().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.effective_to) {
        return data.effective_to >= data.effective_from;
      }
      return true;
    },
    {
      message: 'Effective to date must be after effective from date',
      path: ['effective_to'],
    }
  );

export type WorkingDayPolicyFormValues = z.infer<typeof workingDayPolicySchema>;
