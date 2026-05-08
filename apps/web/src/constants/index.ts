/**
 * Web Constants Index
 * Re-exports from @educard/shared + web-specific constants
 */

// ============================================
// SHARED CONSTANTS (from @educard/shared)
// Single source of truth for Web, iOS, Android
// ============================================

// Core
export {
  colors,
  Colors,
  API_CONFIG,
  APP_INFO,
  STORAGE_KEYS,
  WEB_ROUTES,
  MOBILE_ROUTES,
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
  GENDER_ENUM,
  GENDER_OPTIONS,
  getGenderLabel,
  BLOOD_GROUP,
  BLOOD_GROUP_ENUM,
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
  FormPlaceholders,
  AttendanceUiText,
  InfoMessages,
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
} from '@educard/shared';

// ============================================
// WEB-SPECIFIC CONSTANTS
// Only for web app, not shared
// ============================================

// Web-specific config (uses Vite env vars)
export * from './app-config';

// Branding (logos, taglines - web-specific paths)
export * from './branding';

// Organization types and options
export * from './organization-types';

// Subject colors (UI styling)
export * from './subject-colors';

// Button styles (Tailwind classes - web-specific)
export * from './button-styles';
