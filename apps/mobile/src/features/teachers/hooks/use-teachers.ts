/**
 * Teachers Feature — Hooks
 * React Query hooks for teacher data management
 */

import { QueryKeys } from '@educard/shared';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_PAGE_SIZE } from '@/api/client';

import {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  restoreTeacher,
  type TeacherQueryParams,
} from '../api/teachers-api';

// Query Keys — thin wrappers over shared QueryKeys for backward compat
export const teacherKeys = {
  all: QueryKeys.TEACHERS.ALL,
  lists: () => QueryKeys.TEACHERS.LISTS(),
  list: (params?: Omit<TeacherQueryParams, 'page'>) => QueryKeys.TEACHERS.LIST(params),
  infinite: (params?: Omit<TeacherQueryParams, 'page'>) => QueryKeys.TEACHERS.INFINITE(params),
  details: () => QueryKeys.TEACHERS.DETAILS(),
  detail: (id: string) => QueryKeys.TEACHERS.DETAIL(id),
};

/**
 * Hook to fetch teachers with infinite scroll
 */
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
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.current_page + 1;
      }
      return undefined;
    },
    select: (data) => ({
      teachers: data.pages.flatMap((page) => page.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages[data.pages.length - 1]?.pagination.has_next ?? false,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Hook to fetch teacher details
 */
export function useTeacherDetail(publicId: string, isDeleted?: boolean) {
  return useQuery({
    queryKey: [...teacherKeys.detail(publicId), isDeleted],
    queryFn: () => getTeacherById(publicId, isDeleted),
    select: (response) => response.data,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!publicId,
  });
}

/**
 * Hook to create a teacher
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      forceCreate,
    }: {
      data: Parameters<typeof createTeacher>[0];
      forceCreate?: boolean;
    }) => createTeacher(data, forceCreate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
  });
}

/**
 * Hook to update a teacher
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data: Parameters<typeof updateTeacher>[1];
    }) => updateTeacher(publicId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
  });
}

/**
 * Hook to delete a teacher
 */
export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteTeacher(publicId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}

/**
 * Hook to restore a deleted teacher
 */
export function useRestoreTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => restoreTeacher(publicId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}
