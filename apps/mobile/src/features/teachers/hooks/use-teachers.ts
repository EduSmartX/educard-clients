/**
 * Teachers Feature — Hooks
 * React Query hooks for teacher data management
 */

import { QueryKeys } from '@educard/shared';
import type { TeacherDetail, ApiDetailResponse } from '@educard/shared';
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
import { showToast } from '@/utils/toast';

import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  restoreTeacher,
  type TeacherQueryParams,
} from '../api/teachers-api';

export const teacherKeys = {
  all: QueryKeys.TEACHERS.ALL,
  lists: () => QueryKeys.TEACHERS.LISTS(),
  list: (params?: Omit<TeacherQueryParams, 'page'>) =>
    QueryKeys.TEACHERS.LIST(params),
  infinite: (params?: Omit<TeacherQueryParams, 'page'>) =>
    QueryKeys.TEACHERS.INFINITE(params),
  details: () => QueryKeys.TEACHERS.DETAILS(),
  detail: (id: string) => QueryKeys.TEACHERS.DETAIL(id),
};

export function useTeachers(params?: Omit<TeacherQueryParams, 'page'>) {
  const pageSize = params?.page_size ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: teacherKeys.infinite(params),
    queryFn: ({ pageParam = 1 }) =>
      getTeachers({
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
      teachers: data.pages.flatMap(page => page.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages[data.pages.length - 1]?.pagination.has_next ?? false,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useTeacherDetail(
  publicId: string,
  isDeleted?: boolean,
  userRole?: string | null,
) {
  return useQuery<ApiDetailResponse<TeacherDetail>, Error, TeacherDetail>({
    queryKey: [...teacherKeys.detail(publicId), isDeleted],
    queryFn: () => getTeacherById(publicId, isDeleted, userRole),
    select: response => response.data,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!publicId,
  });
}

export function useCreateTeacher(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      forceCreate,
    }: {
      data: Parameters<typeof createTeacher>[0];
      forceCreate?: boolean;
    }) => createTeacher(data, forceCreate),
    onSuccess: response => {
      showToast('success', response.message || 'Teacher created successfully');
      void queryClient.invalidateQueries({ queryKey: teacherKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create teacher', options?.onError);
    },
  });
}

export function useUpdateTeacher(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data: Parameters<typeof updateTeacher>[1];
    }) => updateTeacher(publicId, data),
    onSuccess: response => {
      showToast('success', response.message || 'Teacher updated successfully');
      void queryClient.invalidateQueries({ queryKey: teacherKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update teacher', options?.onError);
    },
  });
}

export function useDeleteTeacher(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteTeacher(publicId),
    onSuccess: () => {
      showToast('success', 'Teacher deleted successfully');
      void queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete teacher', options?.onError);
    },
  });
}

export function useRestoreTeacher(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => restoreTeacher(publicId),
    onSuccess: response => {
      showToast('success', response.message || 'Teacher restored successfully');
      void queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to restore teacher', options?.onError);
    },
  });
}
