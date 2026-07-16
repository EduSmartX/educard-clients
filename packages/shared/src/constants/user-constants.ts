/**
 * User-related constants
 * Constants for user data that match backend API values
 * Shared across Web, iOS, and Android
 */

/**
 * User role values as used by backend API (lowercase)
 */
export const USER_ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  EMPLOYEE: "employee",
  STUDENT: "student",
  PARENT: "parent",
  STAFF: "staff",
} as const;

export type UserRoleValue = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * User role values in uppercase (for frontend comparisons)
 * Used when comparing roles that have been normalized to uppercase
 */
export const USER_ROLES_UPPER = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  STAFF: "STAFF",
} as const;

export type UserRoleUpper =
  (typeof USER_ROLES_UPPER)[keyof typeof USER_ROLES_UPPER];

/**
 * User role display labels
 */
export const USER_ROLE_LABELS: Record<UserRoleValue, string> = {
  [USER_ROLES.ADMIN]: "Administrator",
  [USER_ROLES.TEACHER]: "Teacher",
  [USER_ROLES.STUDENT]: "Student",
  [USER_ROLES.PARENT]: "Parent",
  [USER_ROLES.STAFF]: "Staff",
};

/**
 * Gender values as used by backend API
 */
export const GENDER = {
  MALE: "M",
  FEMALE: "F",
  OTHER: "O",
} as const;

export type GenderValue = (typeof GENDER)[keyof typeof GENDER];

/**
 * Gender enum tuple for zod validation
 */
export const GENDER_ENUM = [GENDER.MALE, GENDER.FEMALE, GENDER.OTHER] as const;

/**
 * Gender options for form dropdowns
 */
export const GENDER_OPTIONS = [
  { value: GENDER.MALE, label: "Male" },
  { value: GENDER.FEMALE, label: "Female" },
  { value: GENDER.OTHER, label: "Other" },
] as const;

/**
 * Gender options with "All" for filter dropdowns (export, search, etc.)
 */
export const GENDER_OPTIONS_WITH_ALL = [
  { value: "", label: "All" },
  ...GENDER_OPTIONS,
] as const;

/**
 * Helper function to get gender label from value
 */
export function getGenderLabel(value: string): string {
  const option = GENDER_OPTIONS.find((opt) => opt.value === value);
  return option?.label || value;
}

/**
 * Blood group values as used by backend API
 */
export const BLOOD_GROUP = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
} as const;

export type BloodGroupValue = (typeof BLOOD_GROUP)[keyof typeof BLOOD_GROUP];

/**
 * Blood group enum tuple for zod validation
 */
export const BLOOD_GROUP_ENUM = [
  BLOOD_GROUP.A_POSITIVE,
  BLOOD_GROUP.A_NEGATIVE,
  BLOOD_GROUP.B_POSITIVE,
  BLOOD_GROUP.B_NEGATIVE,
  BLOOD_GROUP.AB_POSITIVE,
  BLOOD_GROUP.AB_NEGATIVE,
  BLOOD_GROUP.O_POSITIVE,
  BLOOD_GROUP.O_NEGATIVE,
] as const;

/**
 * Blood group options for form dropdowns
 */
export const BLOOD_GROUP_OPTIONS = [
  { value: BLOOD_GROUP.A_POSITIVE, label: "A+" },
  { value: BLOOD_GROUP.A_NEGATIVE, label: "A-" },
  { value: BLOOD_GROUP.B_POSITIVE, label: "B+" },
  { value: BLOOD_GROUP.B_NEGATIVE, label: "B-" },
  { value: BLOOD_GROUP.AB_POSITIVE, label: "AB+" },
  { value: BLOOD_GROUP.AB_NEGATIVE, label: "AB-" },
  { value: BLOOD_GROUP.O_POSITIVE, label: "O+" },
  { value: BLOOD_GROUP.O_NEGATIVE, label: "O-" },
] as const;

/**
 * Helper function to get blood group label from value
 */
export function getBloodGroupLabel(value: string): string {
  const option = BLOOD_GROUP_OPTIONS.find((opt) => opt.value === value);
  return option?.label || value;
}

/**
 * Relationship values for parent/guardian
 */
export const RELATIONSHIP = {
  FATHER: "father",
  MOTHER: "mother",
  GUARDIAN: "guardian",
  OTHER: "other",
} as const;

export type RelationshipValue =
  (typeof RELATIONSHIP)[keyof typeof RELATIONSHIP];

export const RELATIONSHIP_OPTIONS = [
  { value: RELATIONSHIP.FATHER, label: "Father" },
  { value: RELATIONSHIP.MOTHER, label: "Mother" },
  { value: RELATIONSHIP.GUARDIAN, label: "Guardian" },
  { value: RELATIONSHIP.OTHER, label: "Other" },
] as const;

/**
 * Marital status values
 */
export const MARITAL_STATUS = {
  SINGLE: "single",
  MARRIED: "married",
  DIVORCED: "divorced",
  WIDOWED: "widowed",
} as const;

export type MaritalStatusValue =
  (typeof MARITAL_STATUS)[keyof typeof MARITAL_STATUS];

export const MARITAL_STATUS_OPTIONS = [
  { value: MARITAL_STATUS.SINGLE, label: "Single" },
  { value: MARITAL_STATUS.MARRIED, label: "Married" },
  { value: MARITAL_STATUS.DIVORCED, label: "Divorced" },
  { value: MARITAL_STATUS.WIDOWED, label: "Widowed" },
] as const;
