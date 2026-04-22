/**
 * Refresh On Focus Hook
 * Refetches data when screen comes into focus
 */

import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

export function useRefreshOnFocus<T>(refetch: () => Promise<T>) {
  const firstTimeRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false;
        return;
      }

      refetch();
    }, [refetch])
  );
}
