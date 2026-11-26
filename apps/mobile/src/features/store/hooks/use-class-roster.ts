import type { Student } from '@educard/shared';
import { useQuery } from '@tanstack/react-query';

import { getStudents } from '@/features/students';

const PAGE_SIZE = 100; // the API's maximum

/** Every active student in a class, in roll-number order ("2" before "10"). */
async function fetchClassRoster(classId: string): Promise<Student[]> {
  const students: Student[] = [];
  for (let page = 1; ; page += 1) {
    const response = await getStudents({
      class_id: classId,
      embed_images: false,
      page,
      page_size: PAGE_SIZE,
    });
    students.push(...response.data);
    if (!response.pagination?.has_next) {
      break;
    }
  }
  return students.sort(
    (a, b) =>
      (a.roll_number ?? '').localeCompare(b.roll_number ?? '', undefined, {
        numeric: true,
      }) || a.full_name.localeCompare(b.full_name),
  );
}

/** A whole class, for stepping through its students one at a time. */
export function useClassRoster(classId: string | undefined) {
  return useQuery({
    queryKey: ['store', 'class-roster', classId ?? ''],
    queryFn: () => fetchClassRoster(classId as string),
    enabled: Boolean(classId),
    staleTime: 60 * 1000,
  });
}
