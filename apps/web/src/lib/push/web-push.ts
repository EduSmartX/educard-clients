/**
 * Firebase Web Push registration.
 *
 * Replaces polling on web: FCM delivers the badge update, so the browser holds
 * no connection and the API takes no periodic request. Falls back silently when
 * the browser lacks support or the user denies permission — the conservative
 * unread-count poll still covers those sessions.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from 'firebase/messaging';
import { DEVICE_PLATFORM } from '@educard/shared';

import { registerNotificationDevice } from '@/features/notifications/api/notifications-api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let registeredToken: string | null = null;

export function isWebPushConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && VAPID_KEY);
}

async function getMessagingInstance(): Promise<Messaging | null> {
  if (messaging) {
    return messaging;
  }
  if (!isWebPushConfigured() || !(await isSupported())) {
    return null;
  }
  app ??= initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  return messaging;
}

/** Register the Firebase service worker, passing public config as query params. */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const params = new URLSearchParams(
    Object.entries(firebaseConfig).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value) {
        acc[key] = String(value);
      }
      return acc;
    }, {})
  );
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`, {
    scope: '/',
  });
}

/**
 * Ask for permission and register this browser for push.
 * Returns false when unsupported, unconfigured, or denied — all non-fatal.
 */
export async function enableWebPush(): Promise<boolean> {
  try {
    const instance = await getMessagingInstance();
    if (!instance) {
      return false;
    }

    if (Notification.permission === 'denied') {
      return false;
    }
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    const serviceWorkerRegistration = await registerServiceWorker();
    const token = await getToken(instance, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration,
    });
    if (!token || token === registeredToken) {
      return Boolean(token);
    }

    await registerNotificationDevice({
      token,
      platform: DEVICE_PLATFORM.WEB,
      device_name: navigator.userAgent.slice(0, 128),
    });
    registeredToken = token;
    return true;
  } catch {
    // Push is an enhancement; the poll fallback keeps the badge correct.
    return false;
  }
}

/** Run `onUpdate` whenever a push lands while the tab is open. */
export async function listenForForegroundPush(onUpdate: () => void): Promise<() => void> {
  const instance = await getMessagingInstance();
  if (!instance) {
    return () => undefined;
  }
  return onMessage(instance, () => onUpdate());
}

export function hasPushPermission(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}
