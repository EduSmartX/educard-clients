# EduCard Mobile Migration Plan

## Purpose

Migrate `apps/mobile` from Expo-managed React Native to React Native CLI (bare RN) for:

- GPS tracking
- background location
- background services
- native notifications
- IoT / BLE integrations
- better native performance control

Keep `apps/web` unchanged unless a shared contract needs a small update.

---

## Recommended approach

### Repo strategy

Use the same monorepo.

Why:

- shared API/types stay reusable
- web and mobile stay aligned
- less duplication
- easier incremental migration

### App strategy

Migrate the existing mobile app in place.

Why:

- preserves the current codebase
- avoids duplicate implementation
- easier rollback
- supports phased conversion

### When to create a new repo

Only if:

- mobile and web need separate release cycles
- separate teams own them permanently
- you want a rewrite instead of a migration

---

## Current state

### Monorepo layout

- `apps/mobile` = Expo app
- `apps/web` = Vite web app
- `packages/shared` = shared API, types, utils, constants

### Mobile state

- Expo Router is used for navigation
- Expo modules are used for device features
- code is organized under `app/` and `src/`
- no native `android/` or `ios/` folders yet

### Web state

- web is already separate
- web should not need a React Native CLI migration
- web changes should be limited to shared contract alignment

---

## Migration phases

### Phase 0 - Baseline and freeze

Goal: avoid breaking existing behavior.

Tasks:

- freeze current mobile behavior
- note current routes and screens
- capture environment variables
- list Expo-only dependencies
- identify critical user flows

Outputs:

- route map
- dependency replacement list
- risk list

### Phase 1 - Repo and app bootstrap

Goal: create bare RN app structure inside the same repo.

Tasks:

- add `android/`
- add `ios/`
- replace Expo entrypoint with RN CLI entrypoint
- add standard RN build/runtime config
- update Metro/Babel config for bare RN + monorepo support

Likely file changes:

- `apps/mobile/package.json`
- `apps/mobile/App.tsx` or `index.js`
- `apps/mobile/babel.config.js`
- `apps/mobile/metro.config.js`
- `apps/mobile/react-native.config.js`
- `apps/mobile/android/**`
- `apps/mobile/ios/**`

### Phase 2 - Navigation migration

Goal: replace Expo Router with React Navigation.

Tasks:

- map current file routes to screen-based navigation
- convert route groups to stacks/tabs/drawers
- preserve role-based flows:
  - auth
  - admin
  - employee/teacher
  - parent
  - shared screens

Likely file changes:

- stop using `apps/mobile/app/**` as the route source
- create:
  - `apps/mobile/src/navigation/**`
  - `apps/mobile/src/navigation/navigation-types.ts`
  - `apps/mobile/src/navigation/root-navigation.tsx`
  - `apps/mobile/src/navigation/auth-navigator.tsx`
  - `apps/mobile/src/navigation/main-navigator.tsx`

Migration rule:

- do not delete Expo routes until React Navigation routes are verified

### Phase 3 - Expo dependency replacement

Goal: replace Expo modules with bare RN or native equivalents.

Likely replacements:

- `expo-router` -> React Navigation
- `expo-secure-store` -> `react-native-keychain`
- `expo-notifications` -> `@notifee/react-native` + Firebase messaging if needed
- `expo-location` -> `react-native-geolocation-service`
- background location -> native background location solution
- `expo-image-picker` -> `react-native-image-picker`
- `expo-document-picker` -> `react-native-document-picker`
- `expo-sharing` -> `react-native-share`
- `expo-file-system` -> `react-native-fs`
- `expo-image` -> `react-native-fast-image` or equivalent
- `expo-linear-gradient` -> `react-native-linear-gradient`

Likely file changes:

- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/app.config.js`
- `apps/mobile/src/lib/**`
- `apps/mobile/src/utils/**`
- `apps/mobile/src/components/forms/**`
- `apps/mobile/src/components/common/**`
- `apps/mobile/src/hooks/**`

Rule:

- keep business logic unchanged while swapping platform libraries unless the native library forces a change

### Phase 4 - Native Android configuration

Goal: make Android production-ready for CLI builds.

Tasks:

- configure application id / package
- permissions
- foreground service support
- background location permissions
- notifications setup
- signing configs
- release build types
- Proguard/R8 rules
- Gradle alignment

Likely file changes:

- `apps/mobile/android/app/src/main/AndroidManifest.xml`
- `apps/mobile/android/app/build.gradle`
- `apps/mobile/android/build.gradle`
- `apps/mobile/android/gradle.properties`
- `apps/mobile/android/gradle/wrapper/**`
- `apps/mobile/android/app/src/main/java/**`
- `apps/mobile/android/app/src/main/res/**`

### Phase 5 - Native iOS configuration

Goal: make iOS production-ready for CLI builds.

Tasks:

- configure bundle identifier
- add permissions strings
- background modes
- notification permissions
- capabilities
- pods setup
- signing / provisioning

Likely file changes:

- `apps/mobile/ios/**`
- `apps/mobile/ios/Podfile`
- `apps/mobile/ios/*.xcodeproj`
- `apps/mobile/ios/*.xcworkspace`
- `apps/mobile/ios/**/Info.plist`

### Phase 6 - Shared code validation

Goal: keep `packages/shared` stable and reusable.

Tasks:

- verify API client still works
- verify types still compile
- keep request/response contracts stable
- avoid duplicating shared utilities in mobile

Likely file changes:

- `packages/shared/src/api/**`
- `packages/shared/src/types/**`
- `packages/shared/src/utils/**`
- `packages/shared/src/constants/**`

Only change shared code if:

- mobile migration exposes a real contract mismatch
- both web and mobile need the same fix

### Phase 7 - Web compatibility check

Goal: ensure the web app does not break from shared changes.

Tasks:

- run web type check
- verify shared package imports
- verify API contract compatibility
- update web only if shared contract changes

Likely file changes if needed:

- `apps/web/src/**`
- `apps/web/package.json`
- `packages/shared/**`

### Phase 8 - Performance and device capability work

Goal: support the features that motivated the migration.

Tasks:

- background location strategy
- GPS permission flow
- foreground service on Android
- battery-safe background sync
- notification handling
- BLE / IoT integration layer
- offline queue / retry logic
- app startup optimization

Likely file changes:

- `apps/mobile/src/services/**`
- `apps/mobile/src/hooks/**`
- `apps/mobile/src/context/**`
- `apps/mobile/src/providers/**`
- `apps/mobile/src/native/**` if native bridges are needed

### Phase 9 - Testing and release readiness

Goal: prove the migration is stable.

Test areas:

- auth
- role-based navigation
- dashboards
- attendance
- homework
- exams
- fees
- profile/security
- file upload
- notifications
- background tracking
- Android release build
- iOS release build

Likely file changes:

- test files under `apps/mobile/src/**`
- test setup files
- CI workflow files

---

## File change checklist

### Root workspace

- `package.json`
- workspace scripts if needed
- CI files if build commands change

### `apps/mobile`

- `package.json`
- `app.json`
- `app.config.js`
- `babel.config.js`
- `metro.config.js`
- `tsconfig.json`
- `App.tsx` or `index.js`
- `android/**`
- `ios/**`
- route files under `app/**` if removed or repurposed
- navigation files under `src/navigation/**`
- native utility wrappers under `src/lib/**`
- service wrappers under `src/services/**`

### `packages/shared`

- only if contract or shared utility updates are required

### `apps/web`

- only if shared contracts change

---

## Implementation rules

- migrate in phases, not all at once
- keep business logic unchanged while swapping platform libraries
- do not delete Expo screens/routes until replacement screens are ready
- preserve shared package boundaries
- keep web untouched unless required
- prefer reusable wrappers around native APIs
- keep rollback possible at each phase

---

## Risks

- native dependency incompatibility
- background location battery drain
- iOS background mode restrictions
- Android permission and foreground service complexity
- navigation regression during route conversion
- shared contract drift between mobile and web

Mitigation:

- phased rollout
- feature-by-feature verification
- staged release builds
- rollback checkpoints

---

## Recommended delivery order

1. freeze current behavior
2. bootstrap bare RN app structure
3. convert navigation
4. replace secure storage
5. replace notifications
6. replace location and background services
7. add native Android/iOS config
8. validate shared package and web compatibility
9. finish performance and device integrations
10. run release testing

---

## Decision summary

### Best default

Same repo + migrate current mobile app in place

### Best for the goal

React Native CLI bare app

### Web impact

No major web rewrite expected
