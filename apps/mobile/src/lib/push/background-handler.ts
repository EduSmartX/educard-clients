/**
 * Background/quit-state push handlers.
 *
 * These must be registered outside the React tree, before the app component
 * mounts, so Firebase and Notifee can wake the JS bundle in a headless task.
 */

import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

import { navigateFromPush, parsePushPayload } from './notification-navigation';

export function registerBackgroundPushHandlers() {
  // FCM already shows the tray notification in the background, so this handler
  // only needs to succeed; duplicating it with Notifee would show two entries.
  messaging().setBackgroundMessageHandler(async () => {
    // No-op: presentation is handled by the OS while backgrounded.
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS && detail.notification?.data) {
      navigateFromPush(parsePushPayload(detail.notification.data));
    }
  });
}
