import { useMemo } from 'react';
import { useTeachers } from '@/features/teachers/hooks/use-teachers';
import type { Teacher } from '@/features/teachers/types';

export function useSupervisors() {
  // Only fetch active (not deleted) teachers
  const { data, isLoading } = useTeachers({ page_size: 100, is_deleted: false });
  const supervisors = useMemo<Teacher[]>(() => data?.data || [], [data]);
  return { supervisors, isLoading };
}
