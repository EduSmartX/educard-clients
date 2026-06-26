/**
 * Mobile Constants Index
 * Re-exports from @educard/shared + mobile-specific constants
 */

// ============================================
// SHARED CONSTANTS (from @educard/shared)
// Single source of truth for Web, iOS, Android
// ============================================

// Core
export {
  Colors,
  colors,
  API_CONFIG,
  APP_INFO,
  STORAGE_KEYS,
  MOBILE_ROUTES as ROUTES,
  WEB_ROUTES,
} from '@educard/shared';

// API
export { API_ENDPOINTS, buildUrl, QueryKeys, StatusCodes } from '@educard/shared';

// User & Auth
export {
  USER_ROLES,
  USER_ROLES_UPPER,
  USER_ROLE_LABELS,
  GENDER,
  GENDER_OPTIONS,
  GENDER_OPTIONS_WITH_ALL,
  getGenderLabel,
  BLOOD_GROUP,
  BLOOD_GROUP_OPTIONS,
  getBloodGroupLabel,
  RELATIONSHIP,
  RELATIONSHIP_OPTIONS,
  MARITAL_STATUS,
  MARITAL_STATUS_OPTIONS,
  ADDRESS_TYPE,
  ADDRESS_TYPE_OPTIONS,
  getAddressTypeLabel,
} from '@educard/shared';

// Organization
export {
  ORGANIZATION_TYPES,
  BOARD_AFFILIATIONS,
  getOrganizationTypeLabel,
  getBoardAffiliationLabel,
} from '@educard/shared';

// Signup Flow
export { SIGNUP_STEP_LABELS, SIGNUP_STEP_TITLES, SIGNUP_TOTAL_STEPS } from '@educard/shared';

// Attendance
export {
  SaturdayOffPattern,
  SaturdayOffPatternLabels,
  HolidayType,
  HolidayTypeLabels,
  AttendancePermissions,
  AttendancePermissionLabels,
  AttendanceStatus,
  AttendanceStatusLabels,
  TimesheetStatus,
  TimesheetStatusLabels,
  TimesheetReviewAction,
  DayLockReason,
  AttendanceSession,
  AttendanceSessionLabels,
} from '@educard/shared';

// Messages
export {
  ErrorMessages,
  SuccessMessages,
  ConfirmationMessages,
  ValidationMessages,
  ToastTitles,
  CommonUiText,
} from '@educard/shared';

// Validation utilities
export {
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  isValidUrl,
  isDateInPast,
  isDateInFuture,
  isNotEmpty,
  isValidPinCode,
  isValidAadhaar,
  isValidPan,
} from '@educard/shared';

// Form Schemas (Zod)
export {
  // Field schemas
  emailSchema,
  passwordSchema,
  strongPasswordSchema,
  phoneSchema,
  nameSchema,
  firstNameSchema,
  lastNameSchema,
  genderSchema,
  bloodGroupSchema,
  dateOfBirthSchema,
  addressSchema,
  optionalAddressSchema,
  // Auth schemas
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  // Organization schemas
  organizationInfoSchema,
  adminInfoSchema,
  organizationRegistrationSchema,
} from '@educard/shared';

// Types from shared
export type {
  UserRoleValue,
  UserRoleUpper,
  GenderValue,
  BloodGroupValue,
  RelationshipValue,
  MaritalStatusValue,
  AddressTypeValue,
  SaturdayOffPatternType,
  HolidayTypeValue,
  AttendancePermissionType,
  AttendanceStatusType,
  TimesheetStatusValue,
  TimesheetReviewActionValue,
  DayLockReasonValue,
  AttendanceSessionValue,
  StatusCode,
  // Organization types
  OrganizationType,
  BoardAffiliation,
  // Signup types
  SignupStep,
  SignupStepLabel,
  SignupStepTitle,
  // Form types
  LoginFormData,
  SignupFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  ChangePasswordFormData,
  AddressFormData,
  OrganizationInfoFormData,
  AdminInfoFormData,
  OrganizationRegistrationFormData,
  // Error types
  NormalizedError,
  ApiError,
} from '@educard/shared';

// ============================================
// MOBILE-SPECIFIC CONSTANTS
// Only for mobile app, not shared
// ============================================

// Design System Theme
export {
  Theme,
  SemanticColors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  IconSize,
  ComponentSize,
} from './theme';

// Mobile-specific configuration can be added here
// e.g., animation durations, platform-specific values
