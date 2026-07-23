/**
 * Announcements hooks
 * React Query hooks for creating and listing announcements.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as announcementsApi from '../api/announcements-api';
import type { CreateAnnouncementPayload } from '../types';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
};

export function useAnnouncements() {
  return useQuery({
    queryKey: announcementKeys.lists(),
    queryFn: announcementsApi.fetchAnnouncements,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) =>
      announcementsApi.createAnnouncement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useRetryAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => announcementsApi.retryAnnouncement(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}
