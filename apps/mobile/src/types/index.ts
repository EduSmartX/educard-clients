/**
 * Re-export shared types and add mobile-specific ones
 */

// Re-export everything from shared package
export type {
  // User & Auth types
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
  // API types
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationParams,
  QueryParams,
  // Student types
  Student,
  Guardian,
  Class,
  Section,
  Subject,
} from '@educard/shared';
