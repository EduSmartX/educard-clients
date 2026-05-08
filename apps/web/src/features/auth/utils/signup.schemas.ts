import { z } from 'zod';
import { createAddressSchema } from '@/components/forms/address-schema';
import { isValidIndianPhone } from '@/lib/phone-utils';

export type SignupStep = 1 | 2 | 3 | 4;

export const step1Schema = z.object({
  adminEmail: z.string().email('Please enter a valid admin email'),
  orgEmail: z.string().email('Please enter a valid organization email'),
});

export const step2Schema = z.object({
  adminOtp: z.string().length(6, 'OTP must be 6 digits'),
  orgOtp: z.string().optional(),
});

export const createStep3Schema = (includeAddress: boolean) =>
  z.object({
    orgName: z.string().min(2, 'Organization name is required'),
    orgType: z.string().min(1, 'Organization type is required'),
    orgPhone: z
      .string()
      .min(1, 'Phone number is required')
      .refine(
        (val) => {
          if (!val || val === '+91') return false;
          return isValidIndianPhone(val);
        },
        {
          message: 'Please enter a valid 10-digit Indian mobile number',
        }
      ),
    orgWebsite: z.string().optional(),
    boardAffiliation: z.string().optional(),
    ...createAddressSchema(includeAddress),
  });

export const step4Schema = z
  .object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true; // Optional field
          if (val === '+91') return false;
          return isValidIndianPhone(val);
        },
        {
          message: 'Please enter a valid 10-digit Indian mobile number',
        }
      ),
    gender: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    notificationOptIn: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<ReturnType<typeof createStep3Schema>>;
export type Step4Data = z.infer<typeof step4Schema>;
export type CompleteSignupData = Step1Data & Step2Data & Step3Data & Step4Data;
