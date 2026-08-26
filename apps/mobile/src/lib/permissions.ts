/**
 * Runtime permission helpers.
 *
 * Manifest/Info.plist declarations alone are not enough on Android — dangerous
 * permissions must also be requested at run time.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import type { Permission } from 'react-native';

/** Android 9 (API 28) and below; newer releases use scoped storage with no prompt. */
const LEGACY_STORAGE_MAX_API = 28;

export async function ensureLegacyStorageWritePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const apiLevel =
    typeof Platform.Version === 'number'
      ? Platform.Version
      : Number.parseInt(String(Platform.Version), 10);

  if (Number.isFinite(apiLevel) && apiLevel > LEGACY_STORAGE_MAX_API) {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  if (await PermissionsAndroid.check(permission)) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission, {
    title: 'Allow saving files',
    message:
      'EduCard needs storage access to save downloads to your Downloads folder.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function getAndroidApiLevel(): number {
  return typeof Platform.Version === 'number'
    ? Platform.Version
    : Number.parseInt(String(Platform.Version), 10);
}

/**
 * Ask for the app's device permissions once at startup, so camera, contacts and
 * file pickers open without an interruption later.
 *
 * Android only: iOS has no batch request API and surfaces each prompt when the
 * matching feature is first used.
 */
export async function requestStartupPermissions(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const apiLevel = getAndroidApiLevel();
  const { PERMISSIONS } = PermissionsAndroid;

  const wanted: Permission[] = [PERMISSIONS.CAMERA, PERMISSIONS.READ_CONTACTS];

  if (apiLevel >= 33) {
    wanted.push(PERMISSIONS.READ_MEDIA_IMAGES, PERMISSIONS.POST_NOTIFICATIONS);
  } else {
    wanted.push(PERMISSIONS.READ_EXTERNAL_STORAGE);
  }

  // Only prompt for what is still outstanding; re-asking a denied permission is a no-op.
  const pending: Permission[] = [];
  for (const permission of wanted) {
    if (!(await PermissionsAndroid.check(permission))) {
      pending.push(permission);
    }
  }

  if (pending.length === 0) {
    return;
  }

  try {
    await PermissionsAndroid.requestMultiple(pending);
  } catch {
    // Denial is handled per feature; startup must never fail because of this.
  }
}
