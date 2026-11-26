import type { Student } from '@educard/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getStudents } from '@/features/students';

/**
 * Students of one class section (up to 100, the API's page cap) with picker options.
 * Nothing is fetched until a class is chosen.
 */
export function useClassStudents(classPublicId: string | undefined) {
  const query = useQuery({
    queryKey: ['store', 'class-students', classPublicId ?? ''],
    queryFn: () =>
      getStudents({
        class_id: classPublicId,
        page_size: 100,
        embed_images: false,
      }),
    enabled: Boolean(classPublicId),
    staleTime: 2 * 60 * 1000,
  });

  const students: Student[] = useMemo(
    () => query.data?.data ?? [],
    [query.data],
  );
  const options = useMemo(
    () =>
      students.map(student => ({
        value: student.public_id,
        label: student.roll_number
          ? `${student.full_name} · Roll ${student.roll_number}`
          : student.full_name,
      })),
    [students],
  );
  return {
    students,
    options,
    total: query.data?.pagination.count ?? 0,
    isLoading: Boolean(classPublicId) && query.isLoading,
  };
}
