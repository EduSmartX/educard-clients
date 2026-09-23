/**
 * Mobile Constants Index
 * Re-exports from @educard/shared. Mobile-specific theme constants are added
 * here as screens that need them are migrated.
 */

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
export {
  API_ENDPOINTS,
  buildUrl,
  QueryKeys,
  StatusCodes,
} from '@educard/shared';

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
export {
  SIGNUP_STEP_LABELS,
  SIGNUP_STEP_TITLES,
  SIGNUP_TOTAL_STEPS,
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

// Types from shared
export type {
  UserRoleValue,
  UserRoleUpper,
  GenderValue,
  BloodGroupValue,
  SignupStep,
  NormalizedError,
  ApiError,
} from '@educard/shared';

// Mobile-specific design system theme
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
