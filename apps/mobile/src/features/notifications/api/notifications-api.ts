import { apiClient } from '@/api/client';
import {
  API_ENDPOINTS,
  type MarkAllReadResult,
  type NotificationDevice,
  type NotificationDeviceRegistration,
  type NotificationInboxParams,
  type NotificationPreferencesResponse,
  type NotificationPreferenceUpdatePayload,
  type NotificationUnreadCount,
  type UserNotification,
} from '@educard/shared';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  count: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedNotifications {
  items: UserNotification[];
  pagination: PaginationMeta;
}

const EMPTY_PAGINATION: PaginationMeta = {
  current_page: 1,
  total_pages: 1,
  count: 0,
  page_size: 25,
  has_next: false,
  has_previous: false,
};

export async function getInbox(
  params: NotificationInboxParams = {},
): Promise<PaginatedNotifications> {
  const response = await apiClient.get<
    ApiResponse<UserNotification[]> & { pagination?: PaginationMeta }
  >(API_ENDPOINTS.NOTIFICATIONS.INBOX, { params });
  return {
    items: response.data.data ?? [],
    pagination: response.data.pagination ?? EMPTY_PAGINATION,
  };
}

export async function getUnreadCount(): Promise<NotificationUnreadCount> {
  const response = await apiClient.get<ApiResponse<NotificationUnreadCount>>(
    API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
  );
  return response.data.data;
}

export async function markRead(publicId: string): Promise<UserNotification> {
  const response = await apiClient.post<ApiResponse<UserNotification>>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_READ(publicId),
  );
  return response.data.data;
}

export async function markAllRead(): Promise<MarkAllReadResult> {
  const response = await apiClient.post<ApiResponse<MarkAllReadResult>>(
    API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
  );
  return response.data.data;
}

export async function archiveNotification(
  publicId: string,
): Promise<UserNotification> {
  const response = await apiClient.post<ApiResponse<UserNotification>>(
    API_ENDPOINTS.NOTIFICATIONS.ARCHIVE(publicId),
  );
  return response.data.data;
}

export async function getPreferences(): Promise<NotificationPreferencesResponse> {
  const response = await apiClient.get<
    ApiResponse<NotificationPreferencesResponse>
  >(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES);
  return response.data.data;
}

export async function updatePreferences(
  payload: NotificationPreferenceUpdatePayload,
): Promise<NotificationPreferencesResponse> {
  const response = await apiClient.put<
    ApiResponse<NotificationPreferencesResponse>
  >(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, payload);
  return response.data.data;
}

export async function registerDevice(
  payload: NotificationDeviceRegistration,
): Promise<NotificationDevice> {
  const response = await apiClient.post<ApiResponse<NotificationDevice>>(
    API_ENDPOINTS.NOTIFICATIONS.DEVICES,
    payload,
  );
  return response.data.data;
}

export async function deregisterDevice(publicId: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DEVICE_DETAIL(publicId));
}
