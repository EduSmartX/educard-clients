/**
 * Signup Flow Constants
 * Used by both web and mobile apps for consistent signup experience
 */

/**
 * Signup Step Titles - Short labels for step indicators
 */
export const SIGNUP_STEP_LABELS = [
  "Emails",
  "Verify",
  "Details",
  "Finish",
] as const;

/**
 * Signup Step Titles - Full descriptions for headers
 */
export const SIGNUP_STEP_TITLES = [
  "Email Verification",
  "Verify OTP Codes",
  "Organization Details",
  "Administrator Setup",
] as const;

/**
 * Signup Step Count
 */
export const SIGNUP_TOTAL_STEPS = 4;

// Type definitions
export type SignupStep = 1 | 2 | 3 | 4;
export type SignupStepLabel = (typeof SIGNUP_STEP_LABELS)[number];
export type SignupStepTitle = (typeof SIGNUP_STEP_TITLES)[number];
