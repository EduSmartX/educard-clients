/**
 * Custom hook to handle Android hardware back button
 * Since our hidden screens are inside a Tabs navigator (not a Stack),
 * the Android back button doesn't maintain proper history.
 * This hook intercepts the hardware back press and navigates to the correct parent.
 */

import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * @param parentRoute - The route to navigate to when Android back is pressed
 */
export function useAndroidBack(parentRoute: string) {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.navigate(parentRoute as any);
      }
      return true; // Prevent default behavior
    });

    return () => handler.remove();
  }, [router, parentRoute]);
}
