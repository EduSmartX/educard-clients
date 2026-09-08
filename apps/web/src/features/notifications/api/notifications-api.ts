import apiClient from '@/lib/api';
import {
  API_ENDPOINTS,
  type ApiDetailResponse,
  type ApiListResponse,
  type MarkAllReadResult,
  type NotificationDevice,
  type NotificationDeviceRegistration,
  type NotificationInboxParams,
  type NotificationPreferencesResponse,
  type NotificationPreferenceUpdatePayload,
  type NotificationUnreadCount,
  type UserNotification,
} from '@educard/shared';

/** Every endpoint below is scoped to the authenticated caller by the server. */

export async function fetchInbox(
  params?: NotificationInboxParams
): Promise<ApiListResponse<UserNotification>> {
  const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.INBOX, {
    params,
  });
  return response.data;
}

export async function fetchUnreadCount(): Promise<ApiDetailResponse<NotificationUnreadCount>> {
  const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  return response.data;
}

export async function markNotificationRead(
  publicId: string
): Promise<ApiDetailResponse<UserNotification>> {
  const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(publicId));
  return response.data;
}

export async function markAllNotificationsRead(): Promise<ApiDetailResponse<MarkAllReadResult>> {
  const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
  return response.data;
}

export async function archiveNotification(
  publicId: string
): Promise<ApiDetailResponse<UserNotification>> {
  const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.ARCHIVE(publicId));
  return response.data;
}

export async function fetchNotificationPreferences(): Promise<
  ApiDetailResponse<NotificationPreferencesResponse>
> {
  const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES);
  return response.data;
}

export async function updateNotificationPreferences(
  payload: NotificationPreferenceUpdatePayload
): Promise<ApiDetailResponse<NotificationPreferencesResponse>> {
  const response = await apiClient.put(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, payload);
  return response.data;
}

export async function deregisterNotificationDevice(
  publicId: string
): Promise<ApiDetailResponse<NotificationDevice | null>> {
  const response = await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DEVICE_DETAIL(publicId));
  return response.data;
}

export async function registerNotificationDevice(
  payload: NotificationDeviceRegistration
): Promise<ApiDetailResponse<NotificationDevice>> {
  const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.DEVICES, payload);
  return response.data;
}
