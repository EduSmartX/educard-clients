/**
 * Notifee channel setup.
 *
 * Channels must exist before the first notification is displayed, and their
 * importance is immutable once created on the device, so the ids are versioned
 * implicitly by name.
 */

import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

export const DEFAULT_CHANNEL_ID = 'educard-default';
export const HIGH_PRIORITY_CHANNEL_ID = 'educard-high';

export async function createNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: DEFAULT_CHANNEL_ID,
    name: 'General',
    description: 'Announcements, homework, attendance and other updates.',
    importance: AndroidImportance.DEFAULT,
  });

  await notifee.createChannel({
    id: HIGH_PRIORITY_CHANNEL_ID,
    name: 'Important',
    description: 'Security alerts and time-critical updates.',
    importance: AndroidImportance.HIGH,
  });
}
