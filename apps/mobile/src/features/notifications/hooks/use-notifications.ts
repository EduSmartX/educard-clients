import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  type NotificationInboxParams,
  type NotificationPreferenceUpdatePayload,
} from '@educard/shared';

import {
  archiveNotification,
  getInbox,
  getPreferences,
  getUnreadCount,
  markAllRead,
  markRead,
  updatePreferences,
} from '../api/notifications-api';

export const notificationKeys = {
  all: ['notifications'] as const,
  inbox: () => [...notificationKeys.all, 'inbox'] as const,
  inboxFiltered: (filters: NotificationInboxParams) =>
    [...notificationKeys.inbox(), filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

export function useNotificationInbox(filters: NotificationInboxParams = {}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.inboxFiltered(filters),
    queryFn: ({ pageParam }) => getInbox({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage.pagination.has_next
        ? lastPage.pagination.current_page + 1
        : undefined,
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    enabled,
    staleTime: 15_000,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  };
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (publicId: string) => markRead(publicId),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: markAllRead, onSuccess: invalidate });
}

export function useArchiveNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (publicId: string) => archiveNotification(publicId),
    onSuccess: invalidate,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: getPreferences,
    staleTime: 60_000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationPreferenceUpdatePayload) =>
      updatePreferences(payload),
    onSuccess: data => {
      queryClient.setQueryData(notificationKeys.preferences(), data);
    },
  });
}
