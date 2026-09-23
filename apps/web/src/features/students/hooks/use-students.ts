import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/constants';
import { fetchStudents, fetchStudent } from '../api/students-api';
import type { StudentQueryParams } from '../types';

export function useStudents(params?: StudentQueryParams) {
  return useQuery({
    queryKey: QueryKeys.STUDENTS.LIST(params as Record<string, unknown>),
    queryFn: () => fetchStudents(params),
  });
}

export function useStudent(publicId?: string, isDeleted = false) {
  return useQuery({
    queryKey: QueryKeys.STUDENTS.DETAIL(publicId ?? ''),
    queryFn: () => fetchStudent(publicId!, isDeleted),
    enabled: !!publicId,
  });
}
