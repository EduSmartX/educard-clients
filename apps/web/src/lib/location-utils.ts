/**
 * Location utilities for getting current location and reverse geocoding
 */

export interface LocationData {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

/**
 * Get current location using browser's Geolocation API
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
};

/**
 * Reverse geocode coordinates using Google Maps Geocoding API
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  apiKey?: string
): Promise<LocationData> => {
  // If no API key, try to use browser's built-in reverse geocoding (limited)
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    throw new Error('Unable to get address from location');
  }

  const result = data.results[0];
  const addressComponents = result.address_components;

  // Extract address components
  let streetNumber = '';
  let route = '';
  let locality = '';
  let administrativeArea = '';
  let postalCode = '';
  let country = 'India';

  addressComponents.forEach((component: unknown) => {
    const types = component.types;

    if (types.includes('street_number')) {
      streetNumber = component.long_name;
    } else if (types.includes('route')) {
      route = component.long_name;
    } else if (types.includes('locality')) {
      locality = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      administrativeArea = component.long_name;
    } else if (types.includes('postal_code')) {
      postalCode = component.long_name;
    } else if (types.includes('country')) {
      country = component.long_name;
    }
  });

  const streetAddress =
    [streetNumber, route].filter(Boolean).join(' ') || result.formatted_address.split(',')[0];

  return {
    streetAddress,
    city: locality,
    state: administrativeArea,
    zipCode: postalCode,
    country,
    latitude,
    longitude,
  };
};

/**
 * Get current location and reverse geocode it
 */
export const getCurrentLocationAddress = async (apiKey?: string): Promise<LocationData> => {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;

    const locationData = await reverseGeocode(latitude, longitude, apiKey);
    return locationData;
  } catch (error) {
    if (error instanceof GeolocationPositionError) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          throw new Error(
            'Location permission denied. Please enable location access in your browser settings.'
          );
        case error.POSITION_UNAVAILABLE:
          throw new Error('Location information unavailable. Please try again.');
        case error.TIMEOUT:
          throw new Error('Location request timed out. Please try again.');
        default:
          throw new Error('Unable to get your location. Please try again.');
      }
    }
    throw error;
  }
};
