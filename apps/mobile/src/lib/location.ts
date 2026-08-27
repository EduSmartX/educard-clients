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

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const FIX_TIMEOUT_MS = 15000;

type GeolocationPosition = {
  coords: { latitude: number; longitude: number };
};

type GeolocationModule = {
  getCurrentPosition: (
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: { message: string }) => void,
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

export const isLocationLookupEnabled =
  geocodingApiKey.length > 0 && geolocation !== null;

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
      error => reject(new Error(error.message)),
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
    throw new Error('Could not reach the address service.');
  }

  const data = (await response.json()) as GeocodeResponse;
  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error(
      data.error_message ?? 'No address found for your location.',
    );
  }

  return toAddress(data.results[0]?.address_components ?? []);
}
