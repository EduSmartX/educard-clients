import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/constants';
import { fetchStudents } from '../api/students-api';
import type { StudentListItem } from '../types';

const PAGE_SIZE = 100; // the API's maximum

/** Every active student in a class, in roll-number order ("2" before "10"). */
async function fetchClassRoster(classId: string): Promise<StudentListItem[]> {
  const students: StudentListItem[] = [];
  for (let page = 1; ; page += 1) {
    const response = await fetchStudents({
      class_assigned__public_id: classId,
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
      a.roll_number.localeCompare(b.roll_number, undefined, { numeric: true }) ||
      a.full_name.localeCompare(b.full_name)
  );
}

export function useClassRoster(classId: string | undefined) {
  return useQuery({
    queryKey: QueryKeys.STUDENTS.LIST({ roster: classId }),
    queryFn: () => fetchClassRoster(classId as string),
    enabled: Boolean(classId),
  });
}
