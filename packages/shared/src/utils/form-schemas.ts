/**
 * Shared Form Validation Schemas
 * Zod schemas for form validation across Web and Mobile
 */

import { z } from "zod";
import { GENDER_ENUM, BLOOD_GROUP_ENUM } from "../constants/user-constants";

// Common Validation Patterns

/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Indian phone number regex (10 digits starting with 6-9)
 */
export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Password requirements regex (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Reusable Field Schemas

/**
 * Email field schema
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email");

/**
 * Optional email schema
 */
export const optionalEmailSchema = z
  .string()
  .email("Please enter a valid email")
  .optional()
  .or(z.literal(""));

/**
 * Password field schema
 */
export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters");

/**
 * Strong password field schema (with regex)
 */
export const strongPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .regex(
    PASSWORD_REGEX,
    "Password must contain uppercase, lowercase, and number",
  );

/**
 * Phone number schema (Indian)
 */
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^\d{10}$/, "Please enter a valid 10-digit phone number");

/**
 * Optional phone schema
 */
export const optionalPhoneSchema = z
  .string()
  .regex(/^\d{10}$/, "Please enter a valid 10-digit phone number")
  .optional()
  .or(z.literal(""));

/**
 * Name field schema
 */
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters");

/**
 * First name schema
 */
export const firstNameSchema = z
  .string()
  .min(1, "First name is required")
  .min(2, "First name must be at least 2 characters")
  .max(50, "First name must be less than 50 characters");

/**
 * Last name schema
 */
export const lastNameSchema = z
  .string()
  .min(1, "Last name is required")
  .min(1, "Last name is required")
  .max(50, "Last name must be less than 50 characters");

/**
 * Gender schema
 */
export const genderSchema = z.enum(GENDER_ENUM, {
  errorMap: () => ({ message: "Please select a gender" }),
});

/**
 * Blood group schema
 */
export const bloodGroupSchema = z.enum(BLOOD_GROUP_ENUM, {
  errorMap: () => ({ message: "Please select a blood group" }),
});

/**
 * Optional blood group schema
 */
export const optionalBloodGroupSchema = z
  .enum(BLOOD_GROUP_ENUM)
  .optional()
  .or(z.literal(""));

/**
 * Date of birth schema
 */
export const dateOfBirthSchema = z
  .string()
  .min(1, "Date of birth is required")
  .refine(
    (val) => {
      const date = new Date(val);
      const now = new Date();
      return date < now;
    },
    { message: "Date of birth must be in the past" },
  );

/**
 * Optional date schema
 */
export const optionalDateSchema = z.string().optional().or(z.literal(""));

// Address Schema

/**
 * Address schema for organization/user addresses
 */
export const addressSchema = z.object({
  street_address: z.string().min(1, "Street address is required"),
  address_line_2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().min(1, "ZIP/Postal code is required"),
  country: z.string().default("India"),
});

/**
 * Optional address schema
 */
export const optionalAddressSchema = z.object({
  street_address: z.string().optional().or(z.literal("")),
  address_line_2: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zip_code: z.string().optional().or(z.literal("")),
  country: z.string().default("India"),
});

// Auth Schemas

/**
 * Login form schema
 */
export const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Signup form schema
 */
export const signupSchema = z
  .object({
    first_name: firstNameSchema,
    last_name: lastNameSchema,
    email: emailSchema,
    phone: optionalPhoneSchema,
    organization_code: z
      .string()
      .min(1, "Organization code is required")
      .min(4, "Code must be at least 4 characters"),
    password: strongPasswordSchema,
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password schema
 */
export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, "OTP must be 6 digits"),
    password: strongPasswordSchema,
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

/**
 * Change password schema
 */
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: strongPasswordSchema,
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  });

// Organization Registration Schema

/**
 * Organization info schema for registration
 */
export const organizationInfoSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .min(2, "Name must be at least 2 characters"),
  type: z.string().min(1, "Organization type is required"),
  email: emailSchema,
  phone_number: optionalPhoneSchema,
  board_affiliation: z.string().optional(),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
});

/**
 * Admin info schema for registration
 */
export const adminInfoSchema = z
  .object({
    first_name: firstNameSchema,
    last_name: lastNameSchema,
    email: emailSchema,
    phone: optionalPhoneSchema,
    password: strongPasswordSchema,
    password2: z.string().min(1, "Please confirm your password"),
    notification_opt_in: z.boolean().default(true),
  })
  .refine((data) => data.password === data.password2, {
    message: "Passwords don't match",
    path: ["password2"],
  });

/**
 * Complete organization registration schema
 */
export const organizationRegistrationSchema = z.object({
  organization_info: organizationInfoSchema,
  admin_info: adminInfoSchema,
  address_info: optionalAddressSchema.optional(),
});

// Type Exports

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type OrganizationInfoFormData = z.infer<typeof organizationInfoSchema>;
export type AdminInfoFormData = z.infer<typeof adminInfoSchema>;
export type OrganizationRegistrationFormData = z.infer<
  typeof organizationRegistrationSchema
>;
