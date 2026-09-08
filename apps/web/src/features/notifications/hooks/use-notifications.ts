import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  NOTIFICATION_UNREAD_POLL_MS,
  QueryKeys,
  type NotificationInboxParams,
  type NotificationPreferenceUpdatePayload,
} from '@educard/shared';
import {
  archiveNotification,
  fetchInbox,
  fetchNotificationPreferences,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '../api/notifications-api';

/** Invalidate every notification list plus the header badge after a mutation. */
function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: QueryKeys.NOTIFICATIONS.ALL,
    });
  };
}

export function useNotificationInbox(params: NotificationInboxParams = {}) {
  return useQuery({
    queryKey: QueryKeys.NOTIFICATIONS.INBOX_LIST(params),
    queryFn: () => fetchInbox(params),
    placeholderData: (previous) => previous,
  });
}

export function useUnreadNotificationCount({ poll = true } = {}) {
  return useQuery({
    queryKey: QueryKeys.NOTIFICATIONS.UNREAD_COUNT,
    queryFn: fetchUnreadCount,
    // Push-enabled sessions are updated by the message itself, so no poll.
    refetchInterval: poll ? NOTIFICATION_UNREAD_POLL_MS : false,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (publicId: string) => markNotificationRead(publicId),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });
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
    queryKey: QueryKeys.NOTIFICATIONS.PREFERENCES,
    queryFn: fetchNotificationPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationPreferenceUpdatePayload) =>
      updateNotificationPreferences(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(QueryKeys.NOTIFICATIONS.PREFERENCES, response);
    },
  });
}
