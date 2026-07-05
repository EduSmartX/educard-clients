/**
 * Authentication utility functions
 */

import type { UserRole } from '@/hooks/use-role';
import { USER_ROLES, USER_ROLES_UPPER } from '@/constants';
import { ROUTES } from '@/constants/app-config';

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.TEACHER]: 'Teacher',
  [USER_ROLES.STAFF]: 'Staff',
  [USER_ROLES.STUDENT]: 'Student',
  [USER_ROLES.PARENT]: 'Parent',
};

/**
 * Format a role string for display (e.g., "admin" → "Administrator", "teacher" → "Teacher")
 */
export function formatRole(role?: string | null): string {
  if (!role) {
    return 'User';
  }
  return ROLE_DISPLAY_NAMES[role.toLowerCase()] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Get the dashboard route for a given role.
 *
 * Students are routed to the Parent portal dashboard - there is no
 * dedicated Student role UI, since student accounts are logged into by
 * parents/guardians on their child's behalf.
 */
export function getDashboardRoute(role?: string | null): string {
  const normalizedRole = role?.toLowerCase();
  switch (normalizedRole) {
    case USER_ROLES.ADMIN:
      return ROUTES.ADMIN.DASHBOARD;
    case USER_ROLES.TEACHER:
    case USER_ROLES.STAFF:
      return ROUTES.EMPLOYEE.DASHBOARD;
    case USER_ROLES.PARENT:
    case USER_ROLES.STUDENT:
      return ROUTES.PARENT.DASHBOARD;
    default:
      return '/';
  }
}

/**
 * Get the current user's role from localStorage
 * Returns uppercase role string for consistency
 */
export function getUserRole(): UserRole | null {
  try {
    // User is stored directly in 'user' key (not nested in 'auth')
    const userDataStr = localStorage.getItem('user');
    if (!userDataStr) {
      return null;
    }

    const userData = JSON.parse(userDataStr);
    const role = userData?.role;

    if (!role) {
      return null;
    }

    // Normalize to uppercase for consistency
    return role.toUpperCase() as UserRole;
  } catch {
    return null;
  }
}

/**
 * Check if the current user is an admin
 */
export function isAdminUser(): boolean {
  const role = getUserRole();
  return role === USER_ROLES_UPPER.ADMIN;
}

/**
 * Check if the current user is an employee (teacher or staff)
 */
export function isEmployeeUser(): boolean {
  const role = getUserRole();
  return role === USER_ROLES_UPPER.TEACHER || role === USER_ROLES_UPPER.STAFF;
}

/**
 * Check if the current user is a parent
 */
export function isParentUser(): boolean {
  const role = getUserRole();
  return role === USER_ROLES_UPPER.PARENT;
}

/**
 * Get the appropriate API base path based on user role
 * @param adminPath - The path for admin users
 * @param employeePath - The path for employee users
 * @param parentPath - Optional path for parent users
 */
export function getRoleBasedPath(
  adminPath: string,
  employeePath: string,
  parentPath?: string
): string {
  const role = getUserRole();

  if (role === USER_ROLES_UPPER.ADMIN) {
    return adminPath;
  }

  if (role === USER_ROLES_UPPER.TEACHER || role === USER_ROLES_UPPER.STAFF) {
    return employeePath;
  }

  if (role === USER_ROLES_UPPER.PARENT && parentPath) {
    return parentPath;
  }

  // Default to employee path if role is unknown
  return employeePath;
}
