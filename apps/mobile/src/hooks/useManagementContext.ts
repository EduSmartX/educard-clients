/**
 * Hook to get teacher's management context
 */
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { useAuthStore } from '@/lib/auth-store';

export interface TeacherManagementContext {
  is_supervisor: boolean;
  subordinate_count: number;
  subordinate_ids?: string[]; // List of subordinate user public_ids
  is_class_teacher: boolean;
  student_count: number;
  class_teacher_for: {
    public_id: string;
    name: string;
    class_master: string | null;
  }[];
  class_student_ids?: string[]; // List of student user public_ids in teacher's classes
  can_review_requests: boolean;
  can_manage_balances: boolean;
  can_manage_allocations: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: TeacherManagementContext;
}

export function useTeacherManagementContext() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return useQuery({
    queryKey: ['teacher-management-context'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse>(
        '/leave/employee/reviews/management-context/'
      );
      return response.data?.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !isAdmin && !!user, // Only fetch for non-admin users (teachers)
  });
}

/**
 * Helper hook to check if current teacher is a supervisor of a specific user
 */
export function useIsSubordinateOf(targetUserPublicId?: string) {
  const { data: context, isLoading } = useTeacherManagementContext();
  const { user } = useAuthStore();

  if (user?.role === 'admin') {
    return { isSubordinate: true, isLoading: false }; // Admin can see everything
  }

  if (!context || !targetUserPublicId) {
    return { isSubordinate: false, isLoading };
  }

  // Check if target is in subordinate list
  const isSubordinate = context.subordinate_ids?.includes(targetUserPublicId) ?? false;

  return { isSubordinate, isLoading };
}

/**
 * Helper hook to check if current teacher is class teacher for a student's class
 */
export function useIsClassTeacherFor(studentClassPublicId?: string) {
  const { data: context, isLoading } = useTeacherManagementContext();
  const { user } = useAuthStore();

  if (user?.role === 'admin') {
    return { isClassTeacher: true, isLoading: false }; // Admin can see everything
  }

  if (!context || !studentClassPublicId) {
    return { isClassTeacher: false, isLoading };
  }

  // Check if teacher is class teacher for the student's class
  const isClassTeacher =
    context.class_teacher_for?.some((cls) => cls.public_id === studentClassPublicId) ?? false;

  return { isClassTeacher, isLoading };
}
