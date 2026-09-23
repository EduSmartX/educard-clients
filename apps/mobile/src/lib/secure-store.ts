/**
 * Secure storage backed by react-native-keychain.
 * Drop-in replacement for the expo-secure-store API surface used in the app
 * (getItemAsync / setItemAsync / deleteItemAsync), keyed per item via `service`.
 */

import * as Keychain from 'react-native-keychain';

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword({ service: key });
    return credentials ? credentials.password : null;
  } catch {
    return null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, { service: key });
}

export async function deleteItemAsync(key: string): Promise<void> {
  await Keychain.resetGenericPassword({ service: key });
}
