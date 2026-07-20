import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { USER_ROLES } from '@/constants';
import { fetchClasses } from '@/features/classes/api/classes-api';
import type { Class } from '@/features/classes/types';

/**
 * Hook to fetch managed classes for the current teacher
 *
 * Returns classes where the current user is the class teacher.
 * - Admins get all classes
 * - Teachers get only classes they manage
 * - Other roles get empty array
 *
 * @returns Query result with managed classes array
 */
export function useManagedClasses() {
  const { user } = useAuth();

  return useQuery<Class[], Error>({
    queryKey: ['managed-classes', user?.public_id],
    queryFn: async () => {
      // Keep behavior aligned with student form permission filtering
      const response = await fetchClasses({
        is_deleted: false,
        for_student_form: true,
      });
      return response.data;
    },
    enabled: !!user && (user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.TEACHER),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
