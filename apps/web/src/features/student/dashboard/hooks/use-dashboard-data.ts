/**
 * Student Dashboard Queries
 * React Query hooks for the Student Portal dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/constants';
import { getStudentDashboard } from '../api/dashboard-api';

/**
 * Hook to fetch the authenticated student's dashboard summary.
 */
export function useStudentDashboard() {
  return useQuery({
    queryKey: QueryKeys.STUDENT_PORTAL.DASHBOARD,
    queryFn: () => getStudentDashboard(),
    select: (data) => data.data,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}
