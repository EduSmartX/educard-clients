import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useCriticalOperation } from '@/providers/critical-operation-context';

import {
  createAnnouncement,
  getAnnouncementDetail,
  getAnnouncements,
  retryAnnouncement,
} from '../api/announcements-api';
import type {
  AnnouncementFilterParams,
  CreateAnnouncementPayload,
} from '../api/announcements-api';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: () => [...announcementKeys.all, 'list'] as const,
  filtered: (filters: AnnouncementFilterParams) =>
    [...announcementKeys.list(), filters] as const,
};

export function useAnnouncements(filters: AnnouncementFilterParams = {}) {
  return useInfiniteQuery({
    queryKey: announcementKeys.filtered(filters),
    queryFn: ({ pageParam }) =>
      getAnnouncements({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.pagination.has_next
        ? lastPage.pagination.current_page + 1
        : undefined,
    staleTime: 30_000,
  });
}

export function useAnnouncementDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: [...announcementKeys.all, 'detail', publicId],
    queryFn: () => getAnnouncementDetail(publicId ?? ''),
    enabled: !!publicId,
    staleTime: 30_000,
  });
}

export function useRetryAnnouncement() {
  const queryClient = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();

  return useMutation({
    mutationFn: retryAnnouncement,
    onMutate: () => {
      beginCriticalOperation({
        title: 'Retrying announcement',
        description: 'Resending the announcement to recipients...',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      createAnnouncement(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
    },
  });
}
