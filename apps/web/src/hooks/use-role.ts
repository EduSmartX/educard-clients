/**
 * Hook for checking user role
 *
 * Provides convenient boolean flags for checking the current user's role.
 *
 * @example
 * ```tsx
 * const { isAdmin, isEmployee, isStudent, role } = useRole();
 *
 * if (isAdmin) {
 *   return <AdminDashboard />;
 * }
 * ```
 */

import { useAuth } from './use-auth';
import { USER_ROLES, type UserRoleValue } from '@/constants';

// Note: there is no dedicated Parent role - student accounts are logged
// into by parents/guardians on their child's behalf and reuse the Parent
// portal UI, so role checks only ever need to test for isStudent.
export type UserRole = 'ADMIN' | 'TEACHER' | 'STAFF' | 'STUDENT';

export interface UseRoleReturn {
  role: UserRole | null;
  isAdmin: boolean;
  isEmployee: boolean;
  isTeacher: boolean;
  isStaff: boolean;
  isStudent: boolean;
  isLoading: boolean;
}

export function useRole(): UseRoleReturn {
  const { user } = useAuth();

  const role = user?.role ? (user.role.toUpperCase() as UserRole) : null;
  const lowerRole = user?.role?.toLowerCase() as UserRoleValue | undefined; // NOSONAR

  return {
    role,
    isAdmin: lowerRole === USER_ROLES.ADMIN,
    isEmployee: lowerRole === USER_ROLES.TEACHER || lowerRole === USER_ROLES.STAFF,
    isTeacher: lowerRole === USER_ROLES.TEACHER,
    isStaff: lowerRole === USER_ROLES.STAFF,
    isStudent: lowerRole === USER_ROLES.STUDENT,
    isLoading: false,
  };
}
