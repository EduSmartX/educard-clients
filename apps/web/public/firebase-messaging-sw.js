/**
 * Firebase Web Push service worker.
 *
 * Served from `public/` at the site root so Firebase can find it. Config arrives
 * as query params at registration time, keeping it in env vars rather than
 * committed here. These values are public client config, not secrets.
 */

/* global firebase, importScripts, clients */

importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

const params = new URL(self.location).searchParams;

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = payload.notification?.title || 'EduCard';

  self.registration.showNotification(title, {
    body: payload.notification?.body || '',
    icon: '/vite.svg',
    tag: data.notification_id || undefined,
    data,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const path =
    data.resource_type === 'announcement' && data.resource_public_id
      ? `/announcements/${data.resource_public_id}`
      : '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Reuse an open tab so a click never piles up duplicate windows.
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({ type: 'EDUCARD_NOTIFICATION_CLICK', path });
          return client.focus();
        }
      }
      return clients.openWindow(path);
    })
  );
});
