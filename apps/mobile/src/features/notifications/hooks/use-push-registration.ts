import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/lib/auth-store';
import { initializePush } from '@/lib/push';

import { notificationKeys } from './use-notifications';

/**
 * Binds push registration to the session and refreshes the inbox when the app
 * returns to the foreground (a push may have arrived while it was backgrounded).
 *
 * Deregistration lives in the auth store's logout, where the access token is
 * still valid.
 */
export function usePushRegistration(): void {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userId = useAuthStore(state => state.user?.public_id ?? null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void initializePush();
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      }
    });
    return () => subscription.remove();
  }, [isAuthenticated, queryClient]);
}
