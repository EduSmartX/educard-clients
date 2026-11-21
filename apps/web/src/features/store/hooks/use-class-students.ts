import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys, type StudentListItem, type StudentQueryParams } from '@educard/shared';
import { fetchStudents } from '@/features/students/api/students-api';

/**
 * Students of one class section (up to 100, the API's page cap), with picker options.
 * Nothing is fetched until a class is chosen.
 */
export function useClassStudents(classPublicId: string | undefined) {
  const params: StudentQueryParams = {
    class_assigned__public_id: classPublicId,
    page_size: 100,
    embed_images: false,
  };
  const query = useQuery({
    queryKey: QueryKeys.STUDENTS.LIST(params as Record<string, unknown>),
    queryFn: () => fetchStudents(params),
    enabled: Boolean(classPublicId),
    staleTime: 2 * 60 * 1000,
  });

  const students: StudentListItem[] = useMemo(() => query.data?.data ?? [], [query.data]);
  const options = useMemo(
    () =>
      students.map((student) => ({
        value: student.public_id,
        label: student.roll_number
          ? `${student.full_name} · Roll ${student.roll_number}`
          : student.full_name,
      })),
    [students]
  );
  return {
    students,
    options,
    total: query.data?.pagination.count ?? 0,
    isLoading: Boolean(classPublicId) && query.isLoading,
  };
}
