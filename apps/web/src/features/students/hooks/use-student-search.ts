import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { QueryKeys, type StudentQueryParams } from '@educard/shared';
import { fetchStudents } from '../api/students-api';

interface StudentSearchOptions {
  /** Class section public IDs to search in. Nothing is fetched while this is empty. */
  classIds: string[];
  /** Name, roll number, admission number or email (searched on the server). */
  search?: string;
  pageSize?: number;
  enabled?: boolean;
}

/**
 * Students of one or more classes, searched on the server, so it scales to a whole school.
 * Uses the organization student list: `GET /students/?class_id=a,b&search=…`.
 */
export function useStudentSearch({
  classIds,
  search = '',
  pageSize = 50,
  enabled = true,
}: StudentSearchOptions) {
  const params: StudentQueryParams = {
    class_id: classIds.join(','),
    search: search.trim() || undefined,
    page_size: pageSize,
    embed_images: false,
  };
  const query = useQuery({
    queryKey: QueryKeys.STUDENTS.LIST(params as Record<string, unknown>),
    queryFn: () => fetchStudents(params),
    enabled: enabled && classIds.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
  return {
    students: query.data?.data ?? [],
    total: query.data?.pagination.count ?? 0,
    isLoading: query.isLoading && classIds.length > 0,
    isFetching: query.isFetching,
  };
}
