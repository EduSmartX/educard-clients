/**
 * Classes Feature — Hooks
 */

import { QueryKeys } from '@educard/shared';
import type { Class, ClassDetail } from '@educard/shared';
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
  list: (params?: ClassQueryParams) => QueryKeys.CLASSES.LIST(params),
  infinite: (params?: Omit<ClassQueryParams, 'page'>) =>
    QueryKeys.CLASSES.INFINITE(params),
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
    getNextPageParam: lastPage => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.current_page + 1;
      }
      return undefined;
    },
    select: data => ({
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

/**
 * Hook to fetch managed classes for forms (student/subject creation)
 */
export function useManagedClasses(formType: 'student' | 'subject' = 'student') {
  const params: ClassQueryParams = {
    page_size: 100,
    ...(formType === 'student'
      ? { for_student_form: true }
      : { for_subject_form: true }),
  };

  return useInfiniteQuery({
    queryKey: [...classKeys.lists(), 'managed', formType],
    queryFn: ({ pageParam = 1 }) =>
      getClasses({
        ...params,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      if (lastPage.pagination.has_next) {
        return lastPage.pagination.current_page + 1;
      }
      return undefined;
    },
    select: data => ({
      classes: data.pages.flatMap(page => page.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages[data.pages.length - 1]?.pagination.has_next ?? false,
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useClassDetail(publicId: string, isDeleted?: boolean) {
  return useQuery<ClassDetail>({
    queryKey: [...classKeys.detail(publicId), isDeleted],
    queryFn: async () => {
      const response = await getClassById(publicId, isDeleted);
      return response.data;
    },
    enabled: !!publicId,
  });
}

export function useCreateClass(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      forceCreate,
    }: {
      data: Partial<Class>;
      forceCreate?: boolean;
    }) => createClass(data, forceCreate),
    onSuccess: response => {
      showToast('success', response.message || 'Class created successfully');
      void queryClient.invalidateQueries({ queryKey: classKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create class', options?.onError);
    },
  });
}

export function useUpdateClass(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data: Partial<Class>;
    }) => updateClass(publicId, data),
    onSuccess: response => {
      showToast('success', response.message || 'Class updated successfully');
      void queryClient.invalidateQueries({ queryKey: classKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update class', options?.onError);
    },
  });
}

export function useDeleteClass(options?: MutationOptions) {
  const queryClient = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();
  return useMutation({
    mutationFn: (publicId: string) => deleteClass(publicId),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Deleting class',
        description: 'Removing the class and its related records...',
      });
    },
    onSuccess: () => {
      showToast('success', 'Class deleted successfully');
      void queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete class', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useRestoreClass(options?: MutationOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => restoreClass(publicId),
    onSuccess: response => {
      showToast(
        'success',
        response.message || 'Class reactivated successfully',
      );
      void queryClient.invalidateQueries({ queryKey: classKeys.all });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to reactivate class',
        options?.onError,
      );
    },
  });
}
