/**
 * Firebase Cloud Messaging registration and presentation.
 *
 * FCM delivers the message; Notifee renders it while the app is in the
 * foreground and owns the Android channels. The registration token is treated as
 * a credential: it is sent only to the EduCard API over the authenticated axios
 * client and is never logged.
 */

import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging, {
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { DEVICE_PLATFORM, type DevicePlatform } from '@educard/shared';
import { PermissionsAndroid, Platform } from 'react-native';

import { APP_INFO } from '@/constants/config';
import {
  deregisterDevice,
  registerDevice,
} from '@/features/notifications/api/notifications-api';
import { notificationKeys } from '@/features/notifications/hooks/use-notifications';
import { queryClient } from '@/lib/query-client';

import {
  DEFAULT_CHANNEL_ID,
  HIGH_PRIORITY_CHANNEL_ID,
  createNotificationChannels,
} from './notification-channels';
import { navigateFromPush, parsePushPayload } from './notification-navigation';

const ANDROID_NOTIFICATION_PERMISSION_API = 33;

let registeredDevicePublicId: string | null = null;
let unsubscribeTokenRefresh: (() => void) | null = null;
let unsubscribeForegroundMessage: (() => void) | null = null;
let unsubscribeNotificationOpened: (() => void) | null = null;
let unsubscribeNotifeeForeground: (() => void) | null = null;

function currentPlatform(): DevicePlatform {
  return Platform.OS === 'ios' ? DEVICE_PLATFORM.IOS : DEVICE_PLATFORM.ANDROID;
}

/**
 * Ask the OS for notification permission.
 *
 * A denial is a valid outcome: the app must keep working without push.
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    if (
      Platform.OS === 'android' &&
      Number(Platform.Version) >= ANDROID_NOTIFICATION_PERMISSION_API
    ) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        return false;
      }
    }

    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

export async function hasPushPermission(): Promise<boolean> {
  try {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

async function syncToken(token: string): Promise<void> {
  const device = await registerDevice({
    token,
    platform: currentPlatform(),
    app_version: APP_INFO.VERSION,
    device_name: `${Platform.OS} ${Platform.Version}`,
  });
  registeredDevicePublicId = device.public_id;
}

/**
 * Register this installation for push and attach the message listeners.
 * Safe to call on every authenticated app start; it is a no-op without permission.
 */
export async function initializePush(): Promise<boolean> {
  const granted = await hasPushPermission();
  if (!granted) {
    return false;
  }

  try {
    await createNotificationChannels();

    const token = await messaging().getToken();
    if (!token) {
      return false;
    }
    await syncToken(token);

    attachListeners();
    await handleColdStartNotification();
    return true;
  } catch {
    // Push is an enhancement; startup must not fail when Firebase is unavailable.
    return false;
  }
}

function attachListeners(): void {
  detachListeners();

  unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
    void syncToken(token).catch(() => undefined);
  });

  // Foreground messages are not shown by the OS, so Notifee renders them.
  unsubscribeForegroundMessage = messaging().onMessage(async remoteMessage => {
    await displayNotification(remoteMessage);
    // The push itself is the signal, so the inbox refreshes without polling.
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  });

  // App was backgrounded (not killed) and the user pressed the notification.
  unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(
    remoteMessage => {
      navigateFromPush(parsePushPayload(remoteMessage?.data));
    },
  );

  unsubscribeNotifeeForeground = notifee.onForegroundEvent(
    ({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        navigateFromPush(parsePushPayload(detail.notification.data));
      }
    },
  );
}

function detachListeners(): void {
  unsubscribeTokenRefresh?.();
  unsubscribeForegroundMessage?.();
  unsubscribeNotificationOpened?.();
  unsubscribeNotifeeForeground?.();
  unsubscribeTokenRefresh = null;
  unsubscribeForegroundMessage = null;
  unsubscribeNotificationOpened = null;
  unsubscribeNotifeeForeground = null;
}

/** App was launched from a terminated state by pressing a notification. */
async function handleColdStartNotification(): Promise<void> {
  const initial = await messaging().getInitialNotification();
  if (initial) {
    navigateFromPush(parsePushPayload(initial.data));
  }
}

export async function displayNotification(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const payload = parsePushPayload(remoteMessage.data);
  const channelId =
    payload.category === 'security' || payload.category === 'account'
      ? HIGH_PRIORITY_CHANNEL_ID
      : DEFAULT_CHANNEL_ID;

  await notifee.displayNotification({
    title: remoteMessage.notification?.title ?? 'EduCard',
    body: remoteMessage.notification?.body ?? '',
    data: remoteMessage.data as Record<string, string>,
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      smallIcon: 'ic_notification',
      pressAction: { id: 'default' },
    },
    ios: { sound: 'default' },
  });
}

/** Turn off push for this account on logout; the install keeps its FCM token. */
export async function teardownPush(): Promise<void> {
  detachListeners();
  const devicePublicId = registeredDevicePublicId;
  registeredDevicePublicId = null;
  if (!devicePublicId) {
    return;
  }
  try {
    await deregisterDevice(devicePublicId);
  } catch {
    // A failed deregistration is not fatal: the server retires invalid tokens.
  }
}
