/**
 * Announcements hooks
 * React Query hooks for creating and listing announcements.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as announcementsApi from '../api/announcements-api';
import type { AnnouncementFilterParams } from '../api/announcements-api';
import type { CreateAnnouncementPayload } from '../types';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  list: (filters: AnnouncementFilterParams) => [...announcementKeys.lists(), filters] as const,
  recipientLists: () => [...announcementKeys.all, 'recipient-list'] as const,
  recipientList: (filters: AnnouncementFilterParams) =>
    [...announcementKeys.recipientLists(), filters] as const,
};

export function useAnnouncements(filters: AnnouncementFilterParams = {}) {
  return useQuery({
    queryKey: announcementKeys.list(filters),
    queryFn: () => announcementsApi.fetchAnnouncements(filters),
    placeholderData: (previous) => previous,
  });
}

export function useRecipientAnnouncements(filters: AnnouncementFilterParams = {}) {
  return useQuery({
    queryKey: announcementKeys.recipientList(filters),
    queryFn: () => announcementsApi.fetchRecipientAnnouncements(filters),
    placeholderData: (previous) => previous,
  });
}

export function useAnnouncementDetail(publicId: string | null) {
  return useQuery({
    queryKey: [...announcementKeys.all, 'detail', publicId],
    queryFn: () => announcementsApi.fetchAnnouncementDetail(publicId ?? ''),
    enabled: !!publicId,
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
