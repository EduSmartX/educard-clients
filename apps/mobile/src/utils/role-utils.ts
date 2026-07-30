/**
 * Role-based utility functions for mobile app
 * Handles permission checks and API endpoint selection based on user role
 */

import { STORAGE_KEYS, USER_ROLES } from '@/constants/config';
import * as SecureStore from '@/lib/secure-store';
import type { User } from '@/types/user';

/**
 * Get the current user from secure storage
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    if (!userData) return null;
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

/**
 * Get the current user's role
 */
export async function getUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role?.toLowerCase() ?? null;
}

/**
 * Check if the current user is an admin
 */
export async function isAdminUser(): Promise<boolean> {
  const role = await getUserRole();
  return role === USER_ROLES.ADMIN;
}

/**
 * Check if the current user is a teacher
 */
export async function isTeacherUser(): Promise<boolean> {
  const role = await getUserRole();
  return role === USER_ROLES.EMPLOYEE || role === USER_ROLES.TEACHER;
}

/**
 * Synchronous role check (uses cached user from auth store)
 */
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return role.toLowerCase() === USER_ROLES.ADMIN;
}

/**
 * Synchronous check if user is a teacher
 */
export function isTeacherRole(role?: string | null): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return (
    normalizedRole === USER_ROLES.EMPLOYEE ||
    normalizedRole === USER_ROLES.TEACHER
  );
}

/**
 * Check if user can perform CRUD operations based on role
 */
export function canManageEntity(
  userRole?: string | null,
  options?: {
    isClassTeacher?: boolean;
    entityType?: 'teacher' | 'class' | 'student' | 'subject';
  },
): boolean {
  if (!userRole) return false;

  if (isAdminRole(userRole)) return true;

  if (isTeacherRole(userRole)) {
    const { isClassTeacher, entityType } = options ?? {};

    if (
      isClassTeacher &&
      (entityType === 'student' || entityType === 'subject')
    ) {
      return true;
    }

    return false;
  }

  return false;
}

/**
 * Mask phone number for non-admin users
 */
export function maskPhoneNumber(
  phone?: string | null,
  userRole?: string | null,
  options?: { canViewFull?: boolean },
): string {
  if (!phone) return '-';

  if (isAdminRole(userRole)) return phone;

  if (options?.canViewFull) return phone;

  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 4) {
    return `****${cleaned.slice(-4)}`;
  }
  return '****';
}

/**
 * Get appropriate API base URL based on user role
 */
export function getApiBaseUrl(
  entityType: 'teacher' | 'class' | 'student' | 'subject',
  userRole?: string | null,
  isWriteOperation = false,
): string {
  if (isWriteOperation && isAdminRole(userRole)) {
    return getAdminEndpoint(entityType);
  }

  if (isAdminRole(userRole)) {
    return getAdminEndpoint(entityType);
  }

  return getEmployeeEndpoint(entityType);
}

function getAdminEndpoint(entityType: string): string {
  switch (entityType) {
    case 'teacher':
      return '/teacher/admin/';
    case 'class':
      return '/classes/admin/';
    case 'student':
      return '/students/';
    case 'subject':
      return '/subjects/';
    default:
      return '/';
  }
}

function getEmployeeEndpoint(entityType: string): string {
  switch (entityType) {
    case 'teacher':
      return '/teacher/employee/';
    case 'class':
      return '/classes/employee/';
    case 'student':
      return '/students/';
    case 'subject':
      return '/subjects/';
    default:
      return '/';
  }
}
