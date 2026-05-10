/**
 * Subjects Feature — Hooks
 */

import { QueryKeys } from '@educard/shared';
import type { Subject } from '@educard/shared';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { DEFAULT_PAGE_SIZE } from '@/api/client';

import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  restoreSubject,
  getSubjectsByClass,
  type SubjectQueryParams,
} from '../api/subjects-api';

export const subjectKeys = {
  all: QueryKeys.SUBJECTS.ALL,
  lists: () => QueryKeys.SUBJECTS.LISTS(),
  list: (params?: SubjectQueryParams) =>
    QueryKeys.SUBJECTS.LIST(params as Record<string, unknown> | undefined),
  infinite: (params?: Omit<SubjectQueryParams, 'page'>) => QueryKeys.SUBJECTS.INFINITE(params),
  byClass: (classId: string) => QueryKeys.SUBJECTS.BY_CLASS(classId),
  details: () => QueryKeys.SUBJECTS.DETAILS(),
  detail: (id: string) => QueryKeys.SUBJECTS.DETAIL(id),
};

export function useSubjects(params?: Omit<SubjectQueryParams, 'page'>) {
  const pageSize = params?.page_size ?? DEFAULT_PAGE_SIZE;

  return useInfiniteQuery({
    queryKey: subjectKeys.infinite(params),
    queryFn: ({ pageParam = 1 }) =>
      getSubjects({
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
      subjects: data.pages.flatMap((page) => page.data),
      totalCount: data.pages[0]?.pagination.count ?? 0,
      hasMore: data.pages[data.pages.length - 1]?.pagination.has_next ?? false,
    }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSubjectsByClass(classId: string) {
  return useQuery({
    queryKey: subjectKeys.byClass(classId),
    queryFn: () => getSubjectsByClass(classId),
    enabled: !!classId,
  });
}

export function useSubjectDetail(publicId: string, isDeleted?: boolean) {
  return useQuery({
    queryKey: [...subjectKeys.detail(publicId), isDeleted],
    queryFn: async () => {
      const response = await getSubjectById(publicId, isDeleted);
      return response.data; // Extract the Subject from ApiDetailResponse<Subject>
    },
    enabled: !!publicId,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, forceCreate }: { data: Partial<Subject>; forceCreate?: boolean }) =>
      createSubject(data, forceCreate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: Partial<Subject> }) =>
      updateSubject(publicId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => deleteSubject(publicId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
}

export function useRestoreSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publicId: string) => restoreSubject(publicId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}
