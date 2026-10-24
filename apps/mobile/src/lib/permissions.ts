/**
 * Runtime permission helpers.
 *
 * Manifest/Info.plist declarations alone are not enough: Android dangerous
 * permissions and iOS privacy permissions must also be requested at run time.
 * iOS uses react-native-permissions, whose native handlers are compiled in by
 * setup_permissions in ios/Podfile (re-run `pod install` after changing it).
 */

import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import type { Permission } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  checkMultiple,
  checkNotifications,
  request,
  requestMultiple,
  requestNotifications,
} from 'react-native-permissions';

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
 * iOS counterpart of the Android startup request. Only permissions still in the
 * 'denied' state (never asked) are requested; 'blocked', 'limited' and 'granted'
 * are left alone, so the system dialog appears at most once per permission.
 *
 * Photos and location are not asked here: the photo picker (PHPicker) needs no
 * permission, and location is asked in context when the user taps "Use my location".
 */
async function requestStartupPermissionsIOS(): Promise<void> {
  const wanted = [PERMISSIONS.IOS.CAMERA, PERMISSIONS.IOS.CONTACTS];

  try {
    const statuses = await checkMultiple(wanted);
    const pending = wanted.filter(
      permission => statuses[permission] === RESULTS.DENIED,
    );
    if (pending.length > 0) {
      await requestMultiple(pending);
    }

    const { status } = await checkNotifications();
    if (status === RESULTS.DENIED) {
      await requestNotifications(['alert', 'badge', 'sound']);
    }
  } catch {
    // Denial is handled per feature; startup must never fail because of this.
  }
}

/**
 * Ask for the app's device permissions once at startup, so camera, contacts and
 * notifications work without an interruption later.
 *
 * Photo/media permissions are intentionally not requested on Android: the image
 * picker uses the system Photo Picker, which needs none. Requesting
 * READ_MEDIA_IMAGES made Android 14+ re-prompt on every launch after the user
 * chose "Allow limited access".
 */
export async function requestStartupPermissions(): Promise<void> {
  if (Platform.OS === 'ios') {
    await requestStartupPermissionsIOS();
    return;
  }
  if (Platform.OS !== 'android') {
    return;
  }

  const apiLevel = getAndroidApiLevel();
  const { PERMISSIONS: ANDROID } = PermissionsAndroid;

  const wanted: Permission[] = [ANDROID.CAMERA, ANDROID.READ_CONTACTS];

  if (apiLevel >= 33) {
    wanted.push(ANDROID.POST_NOTIFICATIONS);
  }

  // Only prompt for what is still outstanding. Android stops showing a dialog after
  // the user denies it twice; an expired camera "Only this time" grant is re-asked.
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

function showCameraSettingsAlert(): void {
  Alert.alert(
    'Camera Access Needed',
    'Camera access is turned off for EduCard. Turn it on in Settings to take a photo.',
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => void Linking.openSettings() },
    ],
  );
}

/**
 * Check/request the camera right before opening it. Resolves with no dialog
 * when access is already granted. Needed on iOS because react-native-image-picker
 * presents the camera without checking, so a refused permission shows an
 * unusable camera screen.
 */
export async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      showCameraSettingsAlert();
    } else {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take a photo.',
      );
    }
    return false;
  }

  if (Platform.OS !== 'ios') {
    return true;
  }

  let status = await check(PERMISSIONS.IOS.CAMERA);
  if (status === RESULTS.DENIED) {
    status = await request(PERMISSIONS.IOS.CAMERA);
  }
  if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
    return true;
  }
  if (status === RESULTS.BLOCKED) {
    showCameraSettingsAlert();
  } else {
    Alert.alert(
      'Camera Unavailable',
      'The camera is not available on this device.',
    );
  }
  return false;
}
