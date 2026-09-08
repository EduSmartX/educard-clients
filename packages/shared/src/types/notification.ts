/**
 * Notification Types
 *
 * Mirrors the in-app inbox, preference, and push-device APIs in
 * `edusphere.notifications`.
 *
 * @module types/notification
 */

import type {
  DevicePlatform,
  NotificationCategory,
  NotificationEventType,
  NotificationPriority,
} from "../constants";

/**
 * Navigation hints attached to an event. The server allow-lists these keys, so
 * they never contain marks, fees, contact details, or other sensitive values.
 */
export interface NotificationData {
  route?: string;
  resource_type?: string;
  resource_public_id?: string;
  class_public_id?: string;
  student_public_id?: string;
  tab?: string;
}

/** One row in the authenticated user's inbox. */
export interface UserNotification {
  public_id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  event_type: NotificationEventType;
  priority: NotificationPriority;
  resource_type: string;
  resource_public_id: string;
  data: NotificationData;
  is_read: boolean;
  read_at: string | null;
  seen_at: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface NotificationInboxParams {
  unread?: boolean;
  category?: NotificationCategory;
  page?: number;
  page_size?: number;
}

export interface NotificationUnreadCount {
  unread_count: number;
}

/** One category row in the effective preference matrix. */
export interface NotificationPreferenceRow {
  category: NotificationCategory;
  label: string;
  description: string;
  /** Mandatory categories are always on and cannot be toggled. */
  is_locked: boolean;
  in_app_enabled: boolean;
  /** Delivery to the user's registered mobile devices. Browser push is not supported. */
  push_enabled: boolean;
}

export interface NotificationPreferencesResponse {
  /** Global kill-switch. When false, only mandatory categories are delivered. */
  notifications_enabled: boolean;
  /** Only the categories the caller's role can receive. */
  preferences: NotificationPreferenceRow[];
}

export interface NotificationPreferenceUpdate {
  category: NotificationCategory;
  in_app_enabled: boolean;
  push_enabled: boolean;
}

/** Send either field or both; omitted fields are left unchanged. */
export interface NotificationPreferenceUpdatePayload {
  notifications_enabled?: boolean;
  preferences?: NotificationPreferenceUpdate[];
}

/** Registration payload for one app installation. The token is write-only. */
export interface NotificationDeviceRegistration {
  token: string;
  platform: DevicePlatform;
  installation_id?: string;
  app_version?: string;
  device_name?: string;
}

/** Device metadata returned by the server; the FCM token is never echoed back. */
export interface NotificationDevice {
  public_id: string;
  platform: DevicePlatform;
  device_name: string;
  app_version: string;
  is_active: boolean;
  last_seen_at: string;
  created_at: string;
}

export interface MarkAllReadResult {
  updated: number;
  unread_count: number;
}
