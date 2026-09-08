import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from '@educard/shared';

import { enableWebPush, listenForForegroundPush, isWebPushConfigured } from '@/lib/push/web-push';

interface NotificationClickMessage {
  type: string;
  path?: string;
}

/**
 * Registers this browser for FCM Web Push and refreshes the inbox when a message
 * lands. Returns whether push is active so callers can skip the fallback poll.
 */
export function useWebPush(): { pushEnabled: boolean } {
  const [pushEnabled, setPushEnabled] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isWebPushConfigured()) {
      return;
    }

    let unsubscribe: () => void = () => undefined;
    let cancelled = false;

    void (async () => {
      const enabled = await enableWebPush();
      if (cancelled) {
        return;
      }
      setPushEnabled(enabled);
      if (!enabled) {
        return;
      }

      unsubscribe = await listenForForegroundPush(() => {
        void queryClient.invalidateQueries({
          queryKey: QueryKeys.NOTIFICATIONS.ALL,
        });
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [queryClient]);

  // The service worker forwards clicks so an already-open tab routes in place.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }
    const handler = (event: MessageEvent<NotificationClickMessage>) => {
      if (event.data?.type === 'EDUCARD_NOTIFICATION_CLICK' && event.data.path) {
        void queryClient.invalidateQueries({
          queryKey: QueryKeys.NOTIFICATIONS.ALL,
        });
        navigate(event.data.path);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [navigate, queryClient]);

  return { pushEnabled };
}
