/**
 * Hook for checking user role
 * 
 * Provides convenient boolean flags for checking the current user's role.
 * 
 * @example
 * ```tsx
 * const { isAdmin, isEmployee, isParent, role } = useRole();
 * 
 * if (isAdmin) {
 *   return <AdminDashboard />;
 * }
 * ```
 */

import { useAuth } from './use-auth';
import { USER_ROLES, type UserRoleValue } from '@/constants';

export type UserRole = 'ADMIN' | 'TEACHER' | 'STAFF' | 'PARENT' | 'STUDENT';

export interface UseRoleReturn {
  role: UserRole | null;
  isAdmin: boolean;
  isEmployee: boolean;
  isTeacher: boolean;
  isStaff: boolean;
  isParent: boolean;
  isStudent: boolean;
  isLoading: boolean;
}

export function useRole(): UseRoleReturn {
  const { user } = useAuth();

  const role = user?.role ? (user.role.toUpperCase() as UserRole) : null;
  const lowerRole = user?.role?.toLowerCase() as UserRoleValue | undefined;

  return {
    role,
    isAdmin: lowerRole === USER_ROLES.ADMIN,
    isEmployee: lowerRole === USER_ROLES.TEACHER || lowerRole === USER_ROLES.STAFF,
    isTeacher: lowerRole === USER_ROLES.TEACHER,
    isStaff: lowerRole === USER_ROLES.STAFF,
    isParent: lowerRole === USER_ROLES.PARENT,
    isStudent: lowerRole === USER_ROLES.STUDENT,
    isLoading: false,
  };
}
