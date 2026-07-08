/**
 * User and authentication types
 */

import type { UserRole } from '@/constants/config';

export interface User {
  id?: string;
  public_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  profile_image?: string;
  organization?: Organization;
  is_active?: boolean;
  is_email_verified?: boolean;
  is_mobile_verified?: boolean;
  force_password_reset?: boolean;
  // Guardian fields (for student/parent roles)
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_email_verified?: boolean;
  guardian_phone_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string; // Can be email or username
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  organization_code: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirm_password: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
