/**
 * Shared Types - User & Authentication
 */

import type { UserRoleValue } from '../constants/user-constants';

// Re-export UserRole type for convenience
export type UserRole = UserRoleValue;

// Organization
export interface Organization {
  id: string;
  name: string;
  code: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
}

// User
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  profile_image?: string;
  organization: Organization;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Auth tokens
export interface AuthTokens {
  access: string;
  refresh: string;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Signup data
export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  organization_code: string;
}

// Forgot password data
export interface ForgotPasswordData {
  email: string;
}

// Reset password data
export interface ResetPasswordData {
  token: string;
  password: string;
  confirm_password: string;
}

// Auth response
export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Auth state
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

