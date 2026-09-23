/**
 * Navigation service: exposes a navigation ref for imperative navigation
 * from non-component modules (e.g. the API client on forced logout).
 */

import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function resetToAuth(): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }
}
