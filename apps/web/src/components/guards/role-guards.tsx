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
  const { isAdmin, isEmployee, isParent, isStudent, isLoading } = useRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    // Redirect to appropriate dashboard based on role
    if (isEmployee) {
      return <Navigate to={ROUTES.EMPLOYEE.DASHBOARD} replace />;
    }
    if (isParent || isStudent) {
      return <Navigate to={ROUTES.PARENT.DASHBOARD} replace />;
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
  const { isAdmin, isEmployee, isParent, isStudent, isLoading } = useRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isEmployee) {
    // Redirect to appropriate dashboard based on role
    if (isAdmin) {
      return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
    }
    if (isParent || isStudent) {
      return <Navigate to={ROUTES.PARENT.DASHBOARD} replace />;
    }
    // Not logged in or invalid role
    return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  }

  return <Outlet />;
}

/**
 * ParentRoute - Allow Parent and Student roles
 *
 * Student accounts reuse the Parent portal UI - there is no dedicated
 * Student role UI, since parents/guardians log in using the student's
 * account on their child's behalf.
 */
export function ParentRoute() {
  const { isAdmin, isEmployee, isParent, isStudent, isLoading } = useRole();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isParent && !isStudent) {
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
 * RoleBasedRedirect - Redirect to appropriate dashboard based on role
 * Used for the root protected route
 */
export function RoleBasedRedirect() {
  const { isAdmin, isEmployee, isParent, isStudent } = useRole();

  if (isAdmin) {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  }

  if (isEmployee) {
    return <Navigate to={ROUTES.EMPLOYEE.DASHBOARD} replace />;
  }

  if (isParent || isStudent) {
    return <Navigate to={ROUTES.PARENT.DASHBOARD} replace />;
  }

  // Fallback to login if no valid role
  return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
}
