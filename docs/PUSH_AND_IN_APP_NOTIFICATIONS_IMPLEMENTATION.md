# EduCard Client Notifications Implementation Guide

## Scope

This document is the client companion to the backend
[`push_notifications_implementation.md`](../../educard-backend-api/docs/push_notifications_implementation.md).

Delivers the authenticated in-app inbox and server-backed preferences in both clients, plus
Firebase Cloud Messaging to `apps/mobile` (native) and `apps/web` (Web Push via service worker).

Web Push replaced the unread-count poll: FCM delivers the badge update, so the browser holds no
connection and the API takes no periodic request. A conservative 5-minute poll remains only as a
fallback for sessions where the browser lacks support or the user denied permission.

> Server-Sent Events / WebSockets were evaluated and rejected. The API runs on Cloud Run with
> `--timeout 300` and `--min-instances 0`, so a held-open stream would drop every 5 minutes and
> would prevent scaling to zero. Web Push costs nothing per connected user.

## Shared Contract

Add these exports to `packages/shared` **additively**:

- `API_ENDPOINTS.NOTIFICATIONS` for inbox, unread count, read/read-all/archive, preferences, and
  device registration.
- Transport types for inbox entries, preference categories/rows, devices, mutation payloads, and
  response envelopes.
- Category and priority constants with user-facing labels.
- `QueryKeys.NOTIFICATIONS` for inbox lists, unread count, preferences, and devices.

The server is authoritative for preference values, mandatory-category locks, read state, and
recipient visibility. Clients can cache and optimistically render that state but must not persist
the only source of truth in local storage or Zustand.

## Web: `apps/web`

Create `src/features/notifications/{api,hooks,components,pages,types}` with barrel exports.

1. **Data layer:** feature API calls use `src/lib/api.ts`; queries use shared keys; mutations
   invalidate/update inbox and unread count consistently.
2. **Dashboard header:** add a compact unread badge and recent-item popover to the protected header.
   Mark an item read before navigating through a route constant.
3. **Inbox page:** standard page header, category/unread filters, paginated list, empty/loading/error
   states, item read action, mark-all-read, and archive.
4. **Preferences UI:** add to profile/settings using existing reusable form/layout components.
   `security` and `account` display an always-on explanation; optional categories render separate
   in-app and **mobile push** toggles. Do not claim browser push support.
5. **Poll modestly:** fetch unread count while authenticated at a conservative interval and after
   notification mutations. Do not introduce a websocket in Phase 1.

## React Native: `apps/mobile`

Create `src/features/notifications/{api,hooks,components}` and add the inbox as a shared route in
`navigation/types.ts` and `MainStackNavigator.tsx`.

1. Replace `screens/shared/NotificationsScreen.tsx` local settings state with hooks that read and
   update the server preference API.
2. Use existing `Screen`, `Header`, role themes, toast utility, typed navigation, Axios client, and
   TanStack Query patterns. Mandatory settings remain non-interactive.
3. Add unread badge data to existing notification entry points, refreshing on foreground and after
   mutations.
4. Device registration API integration belongs in Phase 1 only once Firebase iOS/Android native
   configuration has been verified. It must be safe to skip registration when OS notification
   permission is denied.

## Local Testing

### Prerequisites

```bash
# API (terminal 1)
cd educard-backend-api && DJANGO_READ_DOT_ENV_FILE=True .venv/bin/python manage.py runserver 0.0.0.0:8000

# Seed the category master table once, then backfill existing users
.venv/bin/python manage.py populate_notification_categories --sync-users
```

No Celery or Redis is required. `edusphere.utils.task_runner.shared_task` runs `.delay()` work in a
daemon thread inside the same process, so push fan-out happens automatically after the request.

### Web

```bash
corepack pnpm --filter @educard/web dev
```

- Web Push requires a **secure context**. `http://localhost:5173` counts as secure, so dev works.
  Opening the dev server by LAN IP (`http://192.168.x.x:5173`) does **not** — the browser will
  refuse to register the service worker and the app silently falls back to polling.
- Chrome DevTools → Application → Service Workers shows `firebase-messaging-sw.js`. Use
  "Push" there to simulate a message without going through FCM.
- Without `VITE_FIREBASE_*` set, `isWebPushConfigured()` returns false and the app polls instead.
  That is the correct fallback, not a failure.

### Android — one machine, several devices

Multiple emulators run side by side; Android Studio's Device Manager launches as many AVDs as
RAM allows, and Metro serves all of them from one bundler.

```bash
# Launch two AVDs, then confirm both are visible
adb devices
# List of devices attached
# emulator-5554   device
# emulator-5556   device
# R5CT30XXXXX     device      <- your physical phone

corepack pnpm --filter @educard/mobile start          # Metro, once

npx react-native run-android --deviceId=emulator-5554
npx react-native run-android --deviceId=emulator-5556
npx react-native run-android --deviceId=R5CT30XXXXX
```

Two constraints that cause most "push doesn't work" reports:

| Constraint                 | Detail                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Play Services required** | The AVD system image must be **"Google Play"** or **"Google APIs"**. A plain AOSP image has no Play Services, so FCM never delivers and `getToken()` fails.                                      |
| **Host API address**       | An emulator reaches your machine at `10.0.2.2`, not `localhost`. Point `API_CONFIG.BASE_URL` at `http://10.0.2.2:8000/api`. A physical device needs your LAN IP and the phone on the same Wi-Fi. |

Log in as a **different user on each device** to exercise fan-out; each install registers its own
row in `notification_devices`, so one announcement should light up every device at once.

### End-to-end check

1. Sign in on web and on at least one Android device as different users in the same organization.
2. Publish an announcement from an admin account.
3. Expect: inbox row on both, badge increments without a refresh, tray notification on Android,
   and a browser notification on web if permission was granted.
4. Toggle the category off in Settings, publish again, and confirm that user is skipped.
5. Toggle the global switch off and confirm only `security` / `account` still arrive.

### Verifying without Firebase credentials

`PUSH_NOTIFICATIONS_ENABLED=False` (the default) makes `send_to_tokens()` return a skipped result
per device and logs it. Everything except the actual FCM hop is still exercised, so the inbox,
preferences, role scoping, and badge can all be tested before Firebase exists.

## Phase 2: Mobile FCM and Notifee

The required packages are already declared but not yet wired:
`@react-native-firebase/messaging` for remote FCM messages and `@notifee/react-native` for local
foreground display/channels/interaction.

- Verify Firebase Android configuration and iOS APNs capabilities before enabling.
- Request notification permission from a contextual settings/onboarding explanation; OS denial is
  valid and must not block the app.
- Register FCM token/Firebase installation identity on login/startup, repeat after token refresh,
  and deactivate the device on logout.
- Create stable Notifee channels; show foreground notifications and process foreground/background/
  cold-start presses by fetching the authenticated inbox item before navigation.

## Validation

- Web: run the scoped typecheck/lint/format commands already defined by `@educard/web`.
- Mobile: run `corepack pnpm --filter @educard/mobile typecheck`, lint, and tests.
- Confirm a user sees only their own inbox, optional category opt-outs suppress the appropriate
  channel, mandatory categories cannot be disabled, and unread count/read-all remain accurate.
- Complete FCM validation on physical Android and iOS devices once Firebase is provisioned.

> Do not run `pnpm --filter @educard/mobile format`: it rewrites the whole workspace rather than
> the changed files. Rely on the pre-commit `lint-staged` hook instead.

## Implemented Modules

| Path                                                         | Responsibility                                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `packages/shared/src/constants/notification-constants.ts`    | Categories, labels, icons, priorities, platforms, badge cap, poll interval                               |
| `packages/shared/src/types/notification.ts`                  | Inbox, preference, device, and payload transport types                                                   |
| `packages/shared/src/constants/api-endpoints.ts`             | `API_ENDPOINTS.NOTIFICATIONS`                                                                            |
| `packages/shared/src/constants/query-keys.ts`                | `QueryKeys.NOTIFICATIONS`                                                                                |
| `apps/web/src/features/notifications/`                       | api, hooks, `NotificationBell` popover, inbox page, preferences panel, route resolver                    |
| `apps/mobile/src/features/notifications/`                    | api, TanStack hooks, `usePushRegistration`                                                               |
| `apps/mobile/src/lib/push/`                                  | Notifee channels, permission + token lifecycle, foreground/background/cold-start handling, press routing |
| `apps/mobile/src/screens/shared/NotificationInboxScreen.tsx` | Paginated inbox with unread filter, read and archive                                                     |
| `apps/mobile/src/screens/shared/NotificationsScreen.tsx`     | Server-backed per-category preference matrix                                                             |

### Native wiring already in place

- `android/build.gradle`: `com.google.gms:google-services:4.4.2` classpath.
- `android/app/build.gradle`: applies the plugin only when `google-services.json` exists, so a
  developer without Firebase credentials can still build.
- `AndroidManifest.xml`: default channel id `educard-default`, notification icon, and colour.
- `res/drawable/ic_notification.xml` and `res/values/colors.xml`.
- `index.js`: `registerBackgroundPushHandlers()` runs before `AppRegistry.registerComponent`.
- `.gitignore`: `google-services.json` and `GoogleService-Info.plist` are never committed.

### Remaining provisioning

1. Add the Android app (`com.educardmobile`) and iOS bundle id in the Firebase console.
2. Drop `android/app/google-services.json` and `ios/**/GoogleService-Info.plist` into place.
3. Upload the APNs key, enable Push Notifications + Background Modes → Remote notifications, and
   run `cd ios && pod install`.
4. Enable `PUSH_NOTIFICATIONS_ENABLED` on the API with Firebase service-account credentials.
