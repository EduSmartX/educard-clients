/**
 * Role-based utility functions for mobile app
 * Handles permission checks and API endpoint selection based on user role
 */

import * as SecureStore from 'expo-secure-store';

import { STORAGE_KEYS, USER_ROLES } from '@/constants/config';
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
  return role === USER_ROLES.ADMIN || role === 'admin';
}

/**
 * Check if the current user is a teacher
 */
export async function isTeacherUser(): Promise<boolean> {
  const role = await getUserRole();
  return role === USER_ROLES.EMPLOYEE || role === 'teacher' || role === 'employee';
}

/**
 * Synchronous role check (uses cached user from auth store)
 */
export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return ['admin', 'super_admin', 'organization_admin'].includes(normalizedRole);
}

/**
 * Synchronous check if user is a teacher
 */
export function isTeacherRole(role?: string | null): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return normalizedRole === 'teacher' || normalizedRole === 'employee';
}

/**
 * Check if user can perform CRUD operations based on role
 * Admin: Full CRUD
 * Teacher: Read-only (except for classes they're assigned to as class teacher)
 */
export function canManageEntity(
  userRole?: string | null,
  options?: {
    isClassTeacher?: boolean;
    entityType?: 'teacher' | 'class' | 'student' | 'subject';
  }
): boolean {
  if (!userRole) return false;

  // Admin has full access
  if (isAdminRole(userRole)) return true;

  // Teacher permissions
  if (isTeacherRole(userRole)) {
    const { isClassTeacher, entityType } = options ?? {};

    // Teachers can manage students and subjects in classes where they're the class teacher
    if (isClassTeacher && (entityType === 'student' || entityType === 'subject')) {
      return true;
    }

    // Teachers cannot manage other teachers or classes
    return false;
  }

  return false;
}

/**
 * Mask phone number for non-admin users
 * Only shows last 4 digits: ****1234
 */
export function maskPhoneNumber(
  phone?: string | null,
  userRole?: string | null,
  options?: { canViewFull?: boolean }
): string {
  if (!phone) return '-';

  // Admin can see full phone number
  if (isAdminRole(userRole)) return phone;

  // Allow full view if explicitly permitted (e.g., viewing own profile, or in hierarchy)
  if (options?.canViewFull) return phone;

  // Mask phone number for non-admin
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 4) {
    return `****${cleaned.slice(-4)}`;
  }
  return '****';
}

/**
 * Get appropriate API base URL based on user role
 * @param entityType - The type of entity (teacher, class, student, subject)
 * @param userRole - The current user's role
 * @param isWriteOperation - Whether this is a write operation (create/update/delete)
 */
export function getApiBaseUrl(
  entityType: 'teacher' | 'class' | 'student' | 'subject',
  userRole?: string | null,
  isWriteOperation = false
): string {
  // Write operations require admin endpoints
  if (isWriteOperation && isAdminRole(userRole)) {
    return getAdminEndpoint(entityType);
  }

  // Admin uses admin endpoints for reads
  if (isAdminRole(userRole)) {
    return getAdminEndpoint(entityType);
  }

  // Non-admin users use employee endpoints for reads
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
