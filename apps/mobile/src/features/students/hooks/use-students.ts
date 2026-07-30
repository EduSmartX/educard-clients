/**
 * Students Hooks
 */

import { QueryKeys } from '@educard/shared';
import type { Student } from '@educard/shared';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { DEFAULT_PAGE_SIZE } from '@/api/client';
import {
  handleMutationError,
  type MutationOptions,
} from '@/lib/mutation-utils';
import { useCriticalOperation } from '@/providers/critical-operation-context';
import { showToast } from '@/utils/toast';

import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  restoreStudent,
  type StudentQueryParams,
  type StudentDetailResponse,
} from '../api/students-api';

export const studentKeys = {
  all: QueryKeys.STUDENTS.ALL,
  lists: () => QueryKeys.STUDENTS.LISTS(),
  list: (params?: StudentQueryParams) => QueryKeys.STUDENTS.LIST(params),
  infinite: (params?: Omit<StudentQueryParams, 'page'>) =>
    QueryKeys.STUDENTS.INFINITE(params),
  details: () => QueryKeys.STUDENTS.DETAILS(),
  detail: (id: string) => QueryKeys.STUDENTS.DETAIL(id),
};

export function useStudents(params?: Omit<StudentQueryParams, 'page'>) {
  const pageSize = params?.page_size ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: studentKeys.infinite(params),
    queryFn: ({ pageParam = 1 }) =>
      getStudents({
        ...params,
        page: pageParam,
        page_size: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.current_page + 1;
      }
      return undefined;
    },
    select: data => ({
      students: data.pages.flatMap(page => page.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages[data.pages.length - 1]?.pagination.has_next ?? false,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useStudentDetail(publicId: string, isDeleted?: boolean) {
  return useQuery<StudentDetailResponse, Error, Student>({
    queryKey: [...studentKeys.detail(publicId), isDeleted],
    queryFn: () => getStudentById(publicId, isDeleted),
    select: response => response.data,
    enabled: !!publicId,
  });
}

export function useCreateStudent(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      forceCreate,
    }: {
      data: Record<string, unknown>;
      forceCreate?: boolean;
    }) =>
      createStudent(
        data as Partial<Student> & { class_id: string },
        forceCreate,
      ),
    onSuccess: response => {
      showToast('success', response.message || 'Student created successfully');
      void queryClient.invalidateQueries({ queryKey: studentKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create student', options?.onError);
    },
  });
}

export function useUpdateStudent(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data: Partial<Student>;
    }) => updateStudent(publicId, data),
    onSuccess: response => {
      showToast('success', response.message || 'Student updated successfully');
      void queryClient.invalidateQueries({ queryKey: studentKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update student', options?.onError);
    },
  });
}

export function useDeleteStudent(options?: MutationOptions) {
  const queryClient = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: ({
      publicId,
      classId,
    }: {
      publicId: string;
      classId: string;
    }) => deleteStudent(publicId, classId),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Deleting student',
        description: 'Removing the student and related records...',
      });
    },
    onSuccess: response => {
      showToast('success', response?.message || 'Student deleted successfully');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete student', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
      void queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useRestoreStudent(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      classId,
    }: {
      publicId: string;
      classId?: string;
    }) => restoreStudent(publicId, classId),
    onSuccess: response => {
      showToast('success', response.message || 'Student restored successfully');
      void queryClient.invalidateQueries({ queryKey: studentKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to restore student', options?.onError);
    },
  });
}
