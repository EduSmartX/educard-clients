/**
 * Hook to get teacher's management context
 * Returns information about supervisory and class teacher roles
 * Note: This hook should only be called for teachers, not admins
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { QUERY_KEYS, USER_ROLES } from '@/constants';
import { useAuth } from '@/hooks/use-auth';

export interface TeacherManagementContext {
  is_supervisor: boolean;
  subordinate_count: number;
  is_class_teacher: boolean;
  student_count: number;
  class_teacher_for: Array<{
    public_id: string;
    name: string;
    class_master: string | null;
  }>;
  can_review_requests: boolean;
  can_manage_balances: boolean;
  can_manage_allocations: boolean;
}

export function useTeacherManagementContext() {
  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  return useQuery({
    queryKey: [QUERY_KEYS.leave.teacherContext],
    queryFn: async () => {
      const response = await api.get('/leave/employee/reviews/management-context/');
      return response.data?.data as TeacherManagementContext;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !isAdmin, // Only fetch for non-admin users (teachers)
  });
}
