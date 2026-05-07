/**
 * Classes Feature — Hooks
 */

import { QueryKeys } from '@educard/shared';
import type { Class } from '@educard/shared';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_PAGE_SIZE } from '@/api/client';

import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  restoreClass,
  type ClassQueryParams,
} from '../api/classes-api';

export const classKeys = {
  all: QueryKeys.CLASSES.ALL,
  lists: () => QueryKeys.CLASSES.LISTS(),
  list: (params?: ClassQueryParams) =>
    QueryKeys.CLASSES.LIST(params as Record<string, unknown> | undefined),
  infinite: (params?: Omit<ClassQueryParams, 'page'>) => QueryKeys.CLASSES.INFINITE(params),
  details: () => QueryKeys.CLASSES.DETAILS(),
  detail: (id: string) => QueryKeys.CLASSES.DETAIL(id),
};

export function useClasses(params?: Omit<ClassQueryParams, 'page'>) {
  const pageSize = params?.page_size ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: classKeys.infinite(params),
    queryFn: ({ pageParam = 1 }) =>
      getClasses({
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
      classes: data.pages.flatMap((page) => page.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages[data.pages.length - 1]?.pagination.has_next ?? false,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useClassDetail(publicId: string, isDeleted?: boolean) {
  return useQuery({
    queryKey: [...classKeys.detail(publicId), isDeleted],
    queryFn: () => getClassById(publicId, isDeleted),
    enabled: !!publicId,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, forceCreate }: { data: Partial<Class>; forceCreate?: boolean }) =>
      createClass(data, forceCreate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: Partial<Class> }) =>
      updateClass(publicId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteClass(publicId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
}

export function useRestoreClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => restoreClass(publicId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}
