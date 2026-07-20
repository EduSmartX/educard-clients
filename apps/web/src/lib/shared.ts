/**
 * Re-export shared types for web app
 */

// User & Auth types
export type {
  User,
  Organization,
  AuthTokens,
  LoginCredentials,
  SignupData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthResponse,
  AuthState,
  UserRole,
} from '@educard/shared';

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  PaginationParams,
  QueryParams,
} from '@educard/shared';

// Student types
export type { Student, Guardian, Class, Section } from '@educard/shared';

// Re-export utilities
export {
  formatDate,
  formatCurrency,
  formatPhoneNumber,
  getInitials,
  truncate,
  truncateText,
  isValidEmail,
  isValidPhone,
  loginSchema,
  signupSchema,
  studentSchema,
} from '@educard/shared';
