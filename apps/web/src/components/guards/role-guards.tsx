/**
 * Role-based route guards
 *
 * These components protect routes based on user roles.
 * Redirect unauthorized users to appropriate pages.
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '@/hooks/use-role';
import { ROUTES } from '@/constants/app-config';

/**
 * AdminRoute - Only allow Admin role
 * Redirects non-admin users to their respective dashboards
 */
export function AdminRoute() {
  const { isAdmin, isEmployee, isStudent, isLoading } = useRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    // Redirect to appropriate dashboard based on role
    if (isEmployee) {
      return <Navigate to={ROUTES.EMPLOYEE.DASHBOARD} replace />;
    }
    if (isStudent) {
      return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;
    }
    // Not logged in or invalid role
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return <Outlet />;
}

/**
 * EmployeeRoute - Only allow Employee role (Teacher/Staff)
 * Redirects non-employee users to their respective dashboards
 */
export function EmployeeRoute() {
  const { isAdmin, isEmployee, isStudent, isLoading } = useRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isEmployee) {
    // Redirect to appropriate dashboard based on role
    if (isAdmin) {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    if (isStudent) {
      return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;
    }
    // Not logged in or invalid role
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return <Outlet />;
}

/**
 * ParentRoute - Allow Student role
 *
 * Student accounts reuse the Parent portal UI - there is no Parent role
 * or dedicated Student role UI; there is only the Student role, whose
 * accounts are logged into by parents/guardians on their child's behalf.
 */
export function ParentRoute() {
  const { isAdmin, isEmployee, isStudent, isLoading } = useRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isStudent) {
    // Redirect to appropriate dashboard based on role
    if (isAdmin) {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    if (isEmployee) {
      return <Navigate to={ROUTES.EMPLOYEE.DASHBOARD} replace />;
    }
    // Not logged in or invalid role
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return <Outlet />;
}

/**
 * StudentRoute - Only allow Student role
 *
 * Guards the dedicated Student Portal (`/student/*`) pages. Distinct from
 * `ParentRoute`, which guards the earlier parent-facing dashboard reused by
 * student accounts. Redirects non-student users to their respective dashboards.
 */
export function StudentRoute() {
  return <ParentRoute />;
}

/**
 * RoleBasedRedirect - Redirect to appropriate dashboard based on role
 * Used for the root protected route
 */
export function RoleBasedRedirect() {
  const { isAdmin, isEmployee, isStudent } = useRole();

  if (isAdmin) {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  }

  if (isEmployee) {
    return <Navigate to={ROUTES.EMPLOYEE.DASHBOARD} replace />;
  }

  if (isStudent) {
    return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />;
  }

  // Fallback to login if no valid role
  return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
}
