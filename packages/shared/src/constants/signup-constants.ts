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

/**
 * Confirmation shown once an organization registration has been submitted.
 */
export const REGISTRATION_SUBMITTED_TITLE = "Registration Submitted!";

export const buildRegistrationSubmittedMessage = (
  organizationName: string,
  appName: string,
): string =>
  `Thank you for registering "${organizationName}"!\n\n` +
  `Our ${appName} team will review your application and verify the details.\n\n` +
  "You will receive an email once your organization is approved or rejected. " +
  "After approval, you'll have full access to all features.";

// Type definitions
export type SignupStep = 1 | 2 | 3 | 4;
export type SignupStepLabel = (typeof SIGNUP_STEP_LABELS)[number];
export type SignupStepTitle = (typeof SIGNUP_STEP_TITLES)[number];
