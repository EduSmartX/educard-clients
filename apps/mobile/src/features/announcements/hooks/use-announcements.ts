import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getAnnouncementDetail,
  getAnnouncements,
  retryAnnouncement,
} from '../api/announcements-api';

export const announcementKeys = {
  all: ['announcements'] as const,
  list: () => [...announcementKeys.all, 'list'] as const,
};

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.list(),
    queryFn: getAnnouncements,
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

  return useMutation({
    mutationFn: retryAnnouncement,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: announcementKeys.list() });
    },
  });
}
