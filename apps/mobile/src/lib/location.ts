/**
 * location - "Use my location" support for address forms.
 *
 * Asks for foreground location, reads a single fix, then reverse-geocodes it
 * with the Google Geocoding API. The key comes from GOOGLE_GEOCODING_API_KEY
 * (react-native-config); when it is absent the feature stays hidden rather
 * than failing at the point of use.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import Config from 'react-native-config';

export interface ResolvedAddress {
  streetAddress: string;
  /** District in India (administrative_area_level_2), matching the bundled district list. */
  city: string;
  /** Mandal / taluk / tehsil (administrative_area_level_3); often absent in cities. */
  mandal: string;
  state: string;
  zipCode: string;
  country: string;
}

/** Thrown when the user denies location access. */
export const LOCATION_PERMISSION_DENIED = 'LOCATION_PERMISSION_DENIED';

/** Thrown when the device's Location Services (GPS) toggle is off, so no fix can be obtained. */
export const LOCATION_SERVICES_DISABLED = 'LOCATION_SERVICES_DISABLED';

/** Thrown when getCurrentPosition times out (weak GPS signal, indoors, etc.). */
export const LOCATION_TIMEOUT = 'LOCATION_TIMEOUT';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const FIX_TIMEOUT_MS = 15000;

type GeolocationPosition = {
  coords: { latitude: number; longitude: number };
};

type GeolocationErrorLike = {
  message: string;
  /** Standard W3C codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT. */
  code?: number;
};

type GeolocationModule = {
  getCurrentPosition: (
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: GeolocationErrorLike) => void,
    options: {
      enableHighAccuracy: boolean;
      timeout: number;
      maximumAge: number;
    },
  ) => void;
};

/**
 * The native module throws from `TurboModuleRegistry.getEnforcing` at import
 * time until the app is rebuilt, so it is resolved defensively instead of
 * being imported at module scope.
 */
function loadGeolocation(): GeolocationModule | null {
  try {
    const module = require('@react-native-community/geolocation') as {
      default?: GeolocationModule;
    } & GeolocationModule;
    return module.default ?? module;
  } catch {
    return null;
  }
}

const geolocation = loadGeolocation();

export const geocodingApiKey = (Config.GOOGLE_GEOCODING_API_KEY ?? '').trim();

/**
 * Reason "Use my location" is unavailable, in priority order. `null` means
 * the feature is fully configured and ready to use.
 */
export type LocationLookupUnavailableReason =
  | 'missing-api-key'
  | 'native-module-unavailable'
  | null;

export const locationLookupUnavailableReason: LocationLookupUnavailableReason =
  geocodingApiKey.length === 0
    ? 'missing-api-key'
    : geolocation === null
      ? 'native-module-unavailable'
      : null;

export const isLocationLookupEnabled = locationLookupUnavailableReason === null;

/**
 * Runtime check + dev log for whether the Google Geocoding key made it into
 * this build. Call once (e.g. at app startup or when AddressForm mounts) to
 * get a clear, actionable message in Metro/Logcat instead of a silently
 * hidden button. Safe to call in production; it only logs, never throws.
 */
export function logGeocodingConfigStatus(): LocationLookupUnavailableReason {
  if (locationLookupUnavailableReason === 'missing-api-key') {
    console.warn(
      '[location] GOOGLE_GEOCODING_API_KEY is empty or missing. ' +
        '"Use my location" will stay hidden. Set GOOGLE_GEOCODING_API_KEY in ' +
        'apps/mobile/.env* for local builds, or ensure the CI secret ' +
        '(e.g. MOBILE_GOOGLE_GEOCODING_API_KEY) is set and referenced in ' +
        'the build-apk workflow step that writes .env.production.',
    );
  } else if (locationLookupUnavailableReason === 'native-module-unavailable') {
    console.warn(
      '[location] @react-native-community/geolocation native module is not ' +
        'linked in this build. Rebuild the app (native code changed) — ' +
        '"Use my location" will stay hidden until then.',
    );
  } else if (__DEV__) {
    console.log(
      '[location] Geocoding key present and native module linked — location lookup enabled.',
    );
  }
  return locationLookupUnavailableReason;
}

// Surface the status once per app session as soon as this module loads, so
// the reason (if any) shows up in Metro/Logcat/Xcode logs without requiring
// the screen that uses AddressForm to be opened first.
logGeocodingConfigStatus();

interface GeocodeComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GeocodeResponse {
  status: string;
  error_message?: string;
  results: { address_components: GeocodeComponent[] }[];
}

async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message:
        'EduCard needs your location to fill in the address automatically.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function getCurrentPosition(): Promise<{
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    if (!geolocation) {
      reject(new Error('Location is unavailable in this build.'));
      return;
    }
    geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      error => {
        // W3C Geolocation error codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE
        // (commonly means device Location Services/GPS is turned off), 3=TIMEOUT.
        console.warn(
          `[location] getCurrentPosition failed: code=${error.code ?? 'unknown'} message="${error.message}"`,
        );
        if (error.code === 2) {
          reject(new Error(LOCATION_SERVICES_DISABLED));
        } else if (error.code === 3) {
          reject(new Error(LOCATION_TIMEOUT));
        } else {
          reject(new Error(error.message));
        }
      },
      { enableHighAccuracy: true, timeout: FIX_TIMEOUT_MS, maximumAge: 60000 },
    );
  });
}

const pick = (components: GeocodeComponent[], type: string) =>
  components.find(component => component.types.includes(type))?.long_name ?? '';

/**
 * Indian administrative levels map as: level_1 = state, level_2 = district,
 * level_3 = mandal/taluk. Cities often omit level_3, and rural fixes often omit
 * `locality`, so each value falls back to the next best component.
 */
function toAddress(components: GeocodeComponent[]): ResolvedAddress {
  const streetNumber = pick(components, 'street_number');
  const route = pick(components, 'route');
  const sublocality = pick(components, 'sublocality');
  const street = [streetNumber, route || sublocality]
    .filter(Boolean)
    .join(' ')
    .trim();

  const district =
    pick(components, 'administrative_area_level_2') ||
    pick(components, 'locality');

  const mandal =
    pick(components, 'administrative_area_level_3') ||
    pick(components, 'sublocality_level_1');

  return {
    streetAddress: street,
    city: district,
    mandal,
    state: pick(components, 'administrative_area_level_1'),
    zipCode: pick(components, 'postal_code'),
    country: pick(components, 'country'),
  };
}

/**
 * Resolves the device's current address.
 * Rejects with LOCATION_PERMISSION_DENIED when the user declines.
 */
export async function fetchCurrentAddress(): Promise<ResolvedAddress> {
  if (!isLocationLookupEnabled) {
    throw new Error('Location lookup is not configured.');
  }

  const granted = await ensureLocationPermission();
  if (!granted) {
    throw new Error(LOCATION_PERMISSION_DENIED);
  }

  const { latitude, longitude } = await getCurrentPosition();
  const query = `latlng=${latitude},${longitude}&key=${encodeURIComponent(
    geocodingApiKey,
  )}`;
  const response = await fetch(`${GEOCODE_URL}?${query}`);

  if (!response.ok) {
    console.warn(
      `[location] Geocode HTTP error: ${response.status} ${response.statusText}`,
    );
    throw new Error('Could not reach the address service.');
  }

  const data = (await response.json()) as GeocodeResponse;
  if (data.status !== 'OK' || !data.results?.length) {
    // REQUEST_DENIED / INVALID_REQUEST here almost always means the key is
    // present but misconfigured (wrong API not enabled, or the Android
    // package-name/SHA-1 restriction doesn't match this build's signing
    // certificate) — surface it clearly instead of a generic failure.
    console.warn(
      `[location] Geocode API returned status="${data.status}"` +
        (data.error_message ? ` message="${data.error_message}"` : '') +
        '. If status is REQUEST_DENIED, check that the Geocoding API is ' +
        "enabled for the key and that the key's Android restriction " +
        "(package name + SHA-1) matches this build's signing certificate.",
    );
    throw new Error(
      data.error_message ?? 'No address found for your location.',
    );
  }

  return toAddress(data.results[0]?.address_components ?? []);
}
