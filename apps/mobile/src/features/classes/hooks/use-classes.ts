/**
 * Classes Feature — Hooks
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@educard/shared';
import { getClasses, getClassById, createClass, updateClass, deleteClass, restoreClass, type ClassQueryParams } from '../api/classes-api';
import { DEFAULT_PAGE_SIZE } from '@/api/client';

export const classKeys = {
  all: QueryKeys.CLASSES.ALL,
  lists: () => QueryKeys.CLASSES.LISTS(),
  list: (params?: ClassQueryParams) => QueryKeys.CLASSES.LIST(params as any),
  infinite: (params?: Omit<ClassQueryParams, 'page'>) => QueryKeys.CLASSES.INFINITE(params as any),
  details: () => QueryKeys.CLASSES.DETAILS(),
  detail: (id: string) => QueryKeys.CLASSES.DETAIL(id),
};

export function useClasses(params?: Omit<ClassQueryParams, 'page'>) {
  const pageSize = params?.page_size || DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: classKeys.infinite(params),
    queryFn: ({ pageParam = 1 }) => getClasses({
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
      classes: data.pages.flatMap(page => page.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages[data.pages.length - 1]?.pagination.has_next ?? false,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useClassDetail(publicId: string) {
  return useQuery({
    queryKey: classKeys.detail(publicId),
    queryFn: () => getClassById(publicId),
    select: (data) => data.data,
    enabled: !!publicId,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, forceCreate }: { data: any; forceCreate?: boolean }) => createClass(data, forceCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: any }) => updateClass(publicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteClass(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
}

export function useRestoreClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => restoreClass(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
}
