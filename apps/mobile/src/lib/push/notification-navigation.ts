/**
 * Routing for a pressed push notification.
 *
 * The payload only carries identifiers. The destination screen still loads the
 * resource through its own authorized endpoint, so opening a notification never
 * grants access to data the user could not otherwise read.
 */

import { CommonActions } from '@react-navigation/native';

import { navigationRef } from '@/navigation/navigation-service';
import type { SharedStackParamList } from '@/navigation/types';

export interface PushPayload {
  notification_id?: string;
  event_type?: string;
  category?: string;
  resource_type?: string;
  resource_public_id?: string;
  route?: string;
  payload_version?: string;
}

const PAYLOAD_KEYS = [
  'notification_id',
  'event_type',
  'category',
  'resource_type',
  'resource_public_id',
  'route',
  'payload_version',
] as const;

/** A cold-start press arrives before the navigator mounts; replay it once ready. */
let pendingPayload: PushPayload | null = null;

export function parsePushPayload(
  data: Record<string, unknown> | undefined,
): PushPayload {
  if (!data) {
    return {};
  }
  const payload: PushPayload = {};
  for (const key of PAYLOAD_KEYS) {
    const value = data[key];
    if (typeof value === 'string') {
      payload[key] = value;
    }
  }
  return payload;
}

type Target =
  | { screen: 'AnnouncementDetail'; params: { publicId: string } }
  | { screen: 'NotificationInbox'; params: undefined };

function resolveTarget(payload: PushPayload): Target {
  if (payload.resource_type === 'announcement' && payload.resource_public_id) {
    return {
      screen: 'AnnouncementDetail',
      params: { publicId: payload.resource_public_id },
    };
  }
  return { screen: 'NotificationInbox', params: undefined };
}

/** Navigate to the resource a notification points at, defaulting to the inbox. */
export function navigateFromPush(payload: PushPayload): void {
  if (!navigationRef.isReady()) {
    pendingPayload = payload;
    return;
  }

  const target = resolveTarget(payload);
  // The root navigator forwards an unmatched route down to the shared stack.
  navigationRef.dispatch(
    CommonActions.navigate({ name: target.screen, params: target.params }),
  );
}

/** Call once the navigation container is ready to replay a cold-start press. */
export function flushPendingPushNavigation(): void {
  if (!pendingPayload) {
    return;
  }
  const payload = pendingPayload;
  pendingPayload = null;
  navigateFromPush(payload);
}

export type NotificationRouteName = keyof SharedStackParamList;
