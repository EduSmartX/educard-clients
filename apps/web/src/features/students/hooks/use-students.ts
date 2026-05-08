import { useQuery } from '@tanstack/react-query';
import { fetchStudents, fetchStudent } from '../api/students-api';
import type { StudentQueryParams } from '../types';

export function useStudents(params?: StudentQueryParams) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => fetchStudents(params),
  });
}

export function useStudent(publicId?: string, isDeleted = false) {
  return useQuery({
    queryKey: ['student', publicId, isDeleted],
    queryFn: () => fetchStudent(publicId!, isDeleted),
    enabled: !!publicId,
  });
}
