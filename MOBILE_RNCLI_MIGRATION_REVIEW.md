# Mobile Expo to React Native CLI Migration Review

## Purpose

This is the decision and review document to finalize migration scope before implementation starts.

## Objective

1. Migrate only mobile from Expo managed workflow to React Native CLI.
2. Keep a full backup of current app at apps/mobile-expo.
3. Reuse existing mobile business logic and UI as much as possible.
4. Keep web unchanged.

## Scope Boundaries

1. In scope: mobile navigation, native modules, platform config, mobile build scripts, mobile CI workflow.
2. Out of scope: web app features and web code.
3. Out of scope: backend API behavior changes.

## Clarifying Questions

1. Notifications stack after migration: Firebase Messaging only, or Firebase Messaging plus local notifications layer?
2. Secure token storage: keychain only for secrets and AsyncStorage for non-sensitive state, or a single storage strategy?
3. File export behavior:
4. Android must save to Downloads folder?
5. iOS share sheet only acceptable?
6. Deep links to preserve from current app scheme: which paths are mandatory?
7. Navigation naming approach: keep current route semantics or define a new screen naming map?
8. Rollback window: how many releases should keep apps/mobile-expo runnable?
9. Transition rollout: internal QA only first, or pilot users too?
10. Analytics and crash reporting: keep existing setup for phase 1, or migrate in the same effort?
11. Permission prompt timing: keep current UX or redesign per platform best practice?
12. Build signing ownership: who manages Android keystore and iOS provisioning in CI?

Status: answered and locked in Approved Decisions and Recommended Defaults below.

## Approved Decisions (Locked)

1. Deep links to preserve: none from production because app is not released yet.
2. Deep-link architecture going forward: React Navigation linking with Android App Links and iOS Universal Links.
3. Rollback window: no production rollback window required.
4. Expo fallback handling: keep Expo code in a dedicated Git branch until RN CLI reaches feature parity and passes QA.
5. Rollout strategy: internal QA only before first release; then direct production release of RN CLI app.
6. Build signing ownership: EDUCARD Technologies owns Android keystore and iOS provisioning/certificates.
7. Signing security requirement: credentials must be stored securely with restricted access and backup procedures.
8. Permission UX: just-in-time permission requests with pre-permission explanation for sensitive capabilities.

## Recommended Defaults (Adopted)

1. Notifications stack: React Native Firebase Messaging plus Notifee.
2. Secure token strategy: keychain/keystore for secrets and AsyncStorage for non-sensitive state.
3. File export behavior: Android save-to-Downloads and iOS share-sheet flow.
4. Navigation naming strategy: preserve current route semantics first, then optimize naming after stabilization.
5. Analytics/crash reporting: keep current setup in phase 1 and migrate later as a separate track using Firebase Analytics and Firebase Crashlytics.

## Gaps Found in Review (2026-07-26)

These gaps were found by validating the plan against the actual codebase. All fixes are folded into the runbook sections referenced below.

### Blockers (would break build or styling)

1. NativeWind v4 setup was missing. Confirmed in use via tailwind.config.js, global.css, nativewind-env.d.ts, react-native-css-interop. Babel must include nativewind/babel and Metro must wrap with withNativeWind. See sections 6.1 and 6.2.
2. Babel preset was deprecated. Use @react-native/babel-preset, not metro-react-native-babel-preset. See section 6.1.
3. Reanimated 4 plugin name was wrong. With react-native-reanimated 4.x plus react-native-worklets, the Babel plugin is react-native-worklets/plugin and must be last. See section 6.1.
4. pnpm node-linker not addressed. Native autolinking needs node-linker=hoisted plus a preserved Metro monorepo resolver. See sections 6.2 and 6.11.

### High severity

5. Environment variables and dev API auto-detection break. EXPO*PUBLIC* prefix and expo-constants hostUri auto-IP logic have no bare-RN equivalent. See section 6.4.
6. App entry point and registration were missing. Bare RN needs index.js with AppRegistry and an app name. See section 6.5.
7. New Architecture not mentioned. RN 0.83 defaults to it and Reanimated 4 requires it. See section 6.6.
8. Fonts and icons migration missing. @expo/vector-icons and expo-font need native font linking. See section 6.7.
9. Jest config gap. Removing jest-expo needs preset react-native plus transformIgnorePatterns. See section 6.9.
10. Firebase native config missing from phase 1. See section 6.10.

### Medium and low

11. Two RN apps in one workspace cause Metro Haste collisions. See section 6.11.
12. Splash uses a deprecated lib. Use react-native-bootsplash. See section 6.8.
13. react-native-web and vercel.json indicate mobile also targets web. Confirm whether Expo web output must be preserved.
14. app.json has duplicate Android permissions and a duplicate iOS UIBackgroundModes entry; de-dupe on port.
15. buffer needs a global polyfill; verify react-native-svg-transformer need for svg-as-component imports.

## Code Level Impact

### Imports and APIs likely to change

1. Expo Router imports and route helper usage.
2. Expo module imports used by secure storage, pickers, file system, sharing, splash, gradients, image.
3. Expo specific build/config dependencies in mobile package.

### Functions likely to change

1. Navigation functions: push, navigate, replace, back.
2. Route param functions currently using local search params.
3. Root auth redirect logic bound to route segments.
4. File/media utility functions for upload, export, download, share.

### Buttons and components likely to change

1. Screen level action buttons where onPress calls router methods.
2. Header and back actions tied to Expo Router helpers.
3. Link-based tappable elements in auth/profile flows.
4. Dynamic list item actions that navigate with params.

### Areas expected to stay mostly unchanged

1. Shared business logic and data hooks that do not import Expo APIs.
2. Presentational UI components that only receive callback props.
3. Shared package contracts from [educard-clients/packages/shared/src/index.ts](educard-clients/packages/shared/src/index.ts).

## High Impact Files To Review First

1. [educard-clients/apps/mobile/app/\_layout.tsx](educard-clients/apps/mobile/app/_layout.tsx)
2. [educard-clients/apps/mobile/app/index.tsx](educard-clients/apps/mobile/app/index.tsx)
3. [educard-clients/apps/mobile/app/(tabs)/(admin)/\_layout.tsx](<educard-clients/apps/mobile/app/(tabs)/(admin)/_layout.tsx>)
4. [educard-clients/apps/mobile/app/(tabs)/(employee)/\_layout.tsx](<educard-clients/apps/mobile/app/(tabs)/(employee)/_layout.tsx>)
5. [educard-clients/apps/mobile/app/(tabs)/(parent)/\_layout.tsx](<educard-clients/apps/mobile/app/(tabs)/(parent)/_layout.tsx>)
6. [educard-clients/apps/mobile/src/components/navigation/tab-config.ts](educard-clients/apps/mobile/src/components/navigation/tab-config.ts)
7. [educard-clients/apps/mobile/src/components/screens/ManagementScreenBase.tsx](educard-clients/apps/mobile/src/components/screens/ManagementScreenBase.tsx)
8. [educard-clients/apps/mobile/src/features/students/components/StudentList.tsx](educard-clients/apps/mobile/src/features/students/components/StudentList.tsx)
9. [educard-clients/apps/mobile/src/features/classes/components/ClassList.tsx](educard-clients/apps/mobile/src/features/classes/components/ClassList.tsx)
10. [educard-clients/apps/mobile/src/features/teachers/components/TeacherList.tsx](educard-clients/apps/mobile/src/features/teachers/components/TeacherList.tsx)
11. [educard-clients/apps/mobile/src/features/subjects/components/SubjectList.tsx](educard-clients/apps/mobile/src/features/subjects/components/SubjectList.tsx)
12. [educard-clients/apps/mobile/src/lib/auth-store.ts](educard-clients/apps/mobile/src/lib/auth-store.ts)
13. [educard-clients/apps/mobile/src/hooks/useRefreshOnFocus.ts](educard-clients/apps/mobile/src/hooks/useRefreshOnFocus.ts)
14. [educard-clients/apps/mobile/src/hooks/useAndroidBack.ts](educard-clients/apps/mobile/src/hooks/useAndroidBack.ts)
15. [educard-clients/apps/mobile/src/utils/download-template.ts](educard-clients/apps/mobile/src/utils/download-template.ts)
16. [educard-clients/apps/mobile/src/components/forms/FormPhotoUpload.tsx](educard-clients/apps/mobile/src/components/forms/FormPhotoUpload.tsx)
17. [educard-clients/apps/mobile/src/components/forms/FormAttachmentPicker.tsx](educard-clients/apps/mobile/src/components/forms/FormAttachmentPicker.tsx)
18. [educard-clients/apps/mobile/src/components/common/BulkUploadModal.tsx](educard-clients/apps/mobile/src/components/common/BulkUploadModal.tsx)
19. [educard-clients/apps/mobile/package.json](educard-clients/apps/mobile/package.json)
20. [educard-clients/apps/mobile/app.json](educard-clients/apps/mobile/app.json)
21. [educard-clients/apps/mobile/metro.config.js](educard-clients/apps/mobile/metro.config.js)
22. [educard-clients/apps/mobile/babel.config.js](educard-clients/apps/mobile/babel.config.js)
23. [educard-clients/.github/workflows/mobile-build.yml](educard-clients/.github/workflows/mobile-build.yml)

## No Touch Web Boundary

1. [educard-clients/apps/web/package.json](educard-clients/apps/web/package.json)
2. [educard-clients/apps/web/src/main.tsx](educard-clients/apps/web/src/main.tsx)
3. [educard-clients/apps/web/src/App.tsx](educard-clients/apps/web/src/App.tsx)
4. [educard-clients/apps/web/vite.config.ts](educard-clients/apps/web/vite.config.ts)

## Phased TODO Checklist

### Phase A: Backup and Baseline

1. Move current mobile app to apps/mobile-expo.
2. Confirm apps/mobile-expo still runs.
3. Capture current route map and Expo dependency map.
4. Create dedicated Git branch for Expo fallback retention.

### Phase B: RN CLI Scaffold and Monorepo Wiring

1. Scaffold RN CLI app in new apps/mobile with android and ios folders.
2. Set root .npmrc node-linker=hoisted for native autolinking (section 6.11).
3. Recreate Metro monorepo resolution with NativeWind, symlink handling, and mobile-expo blockList (section 6.2).
4. Configure Babel with @react-native/babel-preset + NativeWind + worklets plugin (section 6.1).
5. Add app entry point, env config, and Jest config (sections 6.4, 6.5, 6.9).
6. Enable and verify the New Architecture across native modules (section 6.6).

### Phase C: Navigation Migration

1. Replace root router shell with React Navigation container and role flow.
2. Replace tab layouts for admin, employee, and parent.
3. Migrate route params and back navigation behavior.
4. Replace Link-based interactions with explicit onPress navigation handlers.

### Phase D: Expo Module Replacement

1. Replace secure storage and integrate auth boot sequence.
2. Replace image and document pickers.
3. Replace file system, download, and sharing utilities.
4. Replace splash and gradient dependencies where needed.
5. Remove shim-only code after native validation.

### Phase E: Native Platform Configuration

1. Port Android permissions and manifest settings (de-dupe existing duplicates).
2. Port iOS plist, entitlements, and capabilities (de-dupe UIBackgroundModes).
3. Set up Firebase Messaging + Notifee natively (section 6.10).
4. Migrate fonts/icons and splash screen (sections 6.7, 6.8).
5. Port environment variable strategy for RN CLI (section 6.4).

### Phase F: Build and CI

1. Replace EAS build scripts with native Android and iOS build jobs.
2. Add signing and provisioning secret requirements.
3. Keep web CI path unchanged.

### Phase G: Regression, Cutover, Rollback

1. Validate auth, tabs, shared screens, forms, uploads, exports, and notifications.
2. Validate Android and iOS debug and release builds.
3. Keep Expo fallback branch until RN CLI achieves feature parity and QA signoff.
4. Archive or remove Expo codebase only after production validation approval.

## Detailed Implementation Runbook

### 1. Pre-Migration Commands

Run from [educard-clients](educard-clients).

```bash
# verify clean baseline
git status
pnpm -v
node -v

# install monorepo dependencies first
pnpm install

# capture baseline checks
pnpm --filter @educard/mobile lint
pnpm --filter @educard/mobile typecheck
```

### 2. Backup Current Expo App

```bash
# from repo root
git mv apps/mobile apps/mobile-expo

# update backup package name to avoid duplicate workspace package names
# edit apps/mobile-expo/package.json: "name": "@educard/mobile-expo"

# keep fallback code in dedicated branch
git checkout -b mobile-expo-fallback
git add -A
git commit -m "chore(mobile): preserve expo fallback baseline"

# make sure backup app still has its own lockstep deps
pnpm install

# optional: confirm backup still starts
pnpm --filter @educard/mobile-expo start
```

Note: do not remove this branch until RN CLI feature parity and QA signoff are complete.

### 3. Create New RN CLI App in apps/mobile

```bash
# create a temporary RN app and move generated files
npx @react-native-community/cli@latest init EducardMobile --version 0.83.6 --skip-install
mkdir -p apps/mobile
cp -R EducardMobile/* apps/mobile/
rm -rf EducardMobile

# wire package metadata
cd apps/mobile
pnpm init
# set package name for new CLI app
# edit apps/mobile/package.json: "name": "@educard/mobile"
cd ../..
pnpm install
```

### 4. Install Required Migration Dependencies

```bash
cd apps/mobile

# navigation
pnpm add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
pnpm add react-native-screens react-native-safe-area-context react-native-gesture-handler

# storage, media, files, sharing
pnpm add react-native-keychain react-native-image-picker react-native-document-picker react-native-fs react-native-share react-native-linear-gradient react-native-fast-image react-native-config

# notifications baseline
pnpm add @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native

# analytics and crash reporting (separate track; do not enable in phase 1 cutover)
pnpm add @react-native-firebase/analytics @react-native-firebase/crashlytics

# styling (NativeWind v4 stack — required, app already uses it)
pnpm add nativewind react-native-css-interop react-native-reanimated react-native-worklets

# fonts/icons, splash, env, permissions, svg
pnpm add react-native-vector-icons react-native-bootsplash react-native-config react-native-permissions react-native-svg

# dev dependencies for RN CLI (use @react-native/babel-preset; metro-react-native-babel-preset is deprecated)
pnpm add -D @react-native/babel-preset @react-native/metro-config @react-native/eslint-config @react-native/typescript-config @react-native-community/cli
pnpm add -D tailwindcss react-native-svg-transformer jest babel-jest @types/jest react-test-renderer @testing-library/react-native @types/react-native-vector-icons

cd ../..
pnpm install
```

### 5. Remove Expo-Coupled Dependencies from New apps/mobile

Update [educard-clients/apps/mobile/package.json](educard-clients/apps/mobile/package.json).

Remove (Expo-only):

1. expo, expo-router, and all expo-\* modules (expo-constants, expo-secure-store, expo-image, expo-image-picker, expo-document-picker, expo-file-system, expo-media-library, expo-sharing, expo-splash-screen, expo-linear-gradient, expo-notifications, expo-updates, expo-font, expo-web-browser, expo-status-bar, expo-system-ui, expo-device, expo-location, expo-linking).
2. babel-preset-expo, eslint-config-expo, jest-expo, @expo/vector-icons, @expo/metro-runtime.
3. expo-updates OTA usage (store releases only).

Keep (framework-agnostic, still required):

1. nativewind, react-native-css-interop, tailwindcss, react-native-reanimated, react-native-worklets.
2. react-native-gesture-handler, react-native-safe-area-context, react-native-screens, react-native-svg.
3. @tanstack/react-query, axios, zod, zustand, react-hook-form, date-fns, @educard/shared.

Decide per web need:

1. react-native-web and react-dom — remove unless Expo web output must be preserved (see vercel.json).

Then replace scripts with RN CLI scripts:

```json
{
  "scripts": {
    "start": "react-native start",
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint . --ext .ts,.tsx --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  }
}
```

### 6. Core Config Changes

#### 6.1 Babel

Update [educard-clients/apps/mobile/babel.config.js](educard-clients/apps/mobile/babel.config.js).

Use @react-native/babel-preset (not the deprecated metro-react-native-babel-preset), include the NativeWind preset, and keep the worklets plugin last (Reanimated 4 uses react-native-worklets/plugin, not react-native-reanimated/plugin).

```js
module.exports = {
  presets: [
    ["@react-native/babel-preset", { jsxImportSource: "nativewind" }],
    "nativewind/babel",
  ],
  // Reanimated 4 + worklets: this plugin MUST be last.
  plugins: ["react-native-worklets/plugin"],
};
```

#### 6.2 Metro Monorepo Resolver

Update [educard-clients/apps/mobile/metro.config.js](educard-clients/apps/mobile/metro.config.js). Use the RN CLI metro base, wrap with NativeWind, preserve the pnpm symlink/monorepo resolution ported from the Expo config, and block the retained apps/mobile-expo app to avoid Metro Haste collisions.

```js
const path = require("path");
const { getDefaultConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const sharedPackage = path.resolve(workspaceRoot, "packages/shared");

const config = getDefaultConfig(projectRoot);

// Watch shared package + monorepo root
config.watchFolders = [sharedPackage, workspaceRoot];

// Resolve app node_modules first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Prevent duplicate React / pnpm symlink issues (ported from the Expo config)
config.resolver.extraNodeModules = new Proxy(
  {
    react: path.resolve(projectRoot, "node_modules/react"),
    "react-native": path.resolve(projectRoot, "node_modules/react-native"),
  },
  {
    get: (target, name) =>
      target[name] || path.resolve(projectRoot, "node_modules", String(name)),
  },
);

// Follow symlinks (pnpm)
config.resolver.unstable_enableSymlinks = true;

// Avoid Haste collisions with the retained apps/mobile-expo app
config.resolver.blockList = exclusionList([
  new RegExp(`${path.resolve(workspaceRoot, "apps/mobile-expo")}/.*`),
]);

// SVG-as-component support (only if you import .svg files as React components)
config.transformer.babelTransformerPath =
  require.resolve("react-native-svg-transformer");
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg",
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

module.exports = withNativeWind(config, { input: "./global.css" });
```

Remove the Expo Go shims (animated-shim, lucide-shim, linear-gradient-shim) once native Reanimated, lucide, and linear-gradient render on device.

#### 6.3 TypeScript

Update [educard-clients/apps/mobile/tsconfig.json](educard-clients/apps/mobile/tsconfig.json): extend the RN base, drop the Expo base, keep path aliases, and include NativeWind types.

```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "index.js", "App.tsx", "nativewind-env.d.ts"]
}
```

Keep the NativeWind type reference file:

```ts
// nativewind-env.d.ts
/// <reference types="nativewind/types" />
```

#### 6.4 Environment Variables and Dev API URL

The Expo app reads process.env.EXPO*PUBLIC_API_URL and uses expo-constants (Constants.expoConfig.hostUri) to auto-detect the LAN IP in Expo Go. Bare RN has no EXPO_PUBLIC* inlining and no hostUri auto-detect.

Steps:

1. Adopt react-native-config; rename EXPO*PUBLIC_API_URL to API_URL (and other EXPO_PUBLIC*\* keys) across .env files.
2. Replace the auto-IP logic in src/constants/config.ts with a static per-platform default.
3. Replace the cp .env.local .env script pattern with react-native-config ENVFILE selection.

Example replacement for src/constants/config.ts:

```ts
// old
import Constants from "expo-constants";
const debuggerHost = Constants.expoConfig?.hostUri;
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? getDefaultApiUrl();

// new
import Config from "react-native-config";
import { Platform } from "react-native";
const devFallback =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api"
    : "http://localhost:8000/api";
const BASE_URL = (Config.API_URL ?? devFallback).trim();
```

Android release env is read at build time; run with ENVFILE=.env.production before assembling.

#### 6.5 App Entry Point and Registration

Bare RN replaces expo-router/entry with an explicit entry file and app registration.

```js
// index.js
import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";
AppRegistry.registerComponent(appName, () => App);
```

```json
// app.json (RN CLI app name registration)
{ "name": "EducardMobile", "displayName": "EduCard" }
```

Set package.json main to index.js, and make App.tsx render RootNavigator and import ./global.css.

#### 6.6 New Architecture

RN 0.83 enables the New Architecture (Fabric/TurboModules) by default, and Reanimated 4 requires it.

Steps:

1. Confirm newArchEnabled is on (Android gradle.properties, iOS Podfile RCT_NEW_ARCH_ENABLED).
2. Verify New Arch support for each native module: reanimated, gesture-handler, screens, safe-area-context, svg, keychain, image-picker, document-picker, fs, share, linear-gradient, fast-image, config, permissions, firebase, notifee.
3. Flag react-native-keyboard-aware-scroll-view (unmaintained); consider react-native-keyboard-controller.

#### 6.7 Fonts and Icons

Expo used @expo/vector-icons and expo-font.

Steps:

1. Move to react-native-vector-icons and register fonts natively.
2. Android: apply fonts.gradle in android/app/build.gradle.
3. iOS: list font filenames under UIAppFonts in Info.plist and run pod install.
4. Remove the lucide shim once icons render natively.

#### 6.8 Splash Screen

Replace expo-splash-screen with react-native-bootsplash (react-native-splash-screen is deprecated).

Steps:

1. Generate assets from the current splash image and #3B82F6 background.
2. Wire native show/hide; hide after auth boot in the root navigator.

#### 6.9 Jest Testing Config

Removing jest-expo requires a native RN Jest config with transform allowances for NativeWind, Reanimated, and navigation.

```js
// jest.config.js
module.exports = {
  preset: "react-native",
  setupFiles: ["./jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?@react-native|react-native|@react-navigation|react-native-reanimated|react-native-worklets|nativewind|react-native-css-interop|react-native-gesture-handler|react-native-vector-icons)/)",
  ],
};
```

```js
// jest.setup.js
import "@testing-library/react-native/extend-expect";
require("react-native-reanimated").setUpTests?.();
```

#### 6.10 Firebase Native Setup (phase 1 messaging)

Messaging and Notifee need native config in phase 1.

Steps:

1. Android: add google-services.json to android/app; apply the com.google.gms.google-services Gradle plugin.
2. iOS: add GoogleService-Info.plist to the Xcode project; enable Push Notifications and Background Modes (remote notifications).
3. iOS Podfile: Firebase needs static frameworks; set use_frameworks! :linkage => :static and verify conflicts.
4. Notifications service: request POST_NOTIFICATIONS on Android 13+, register the FCM token, handle foreground/background messages, and display via Notifee channels.
5. Keep Analytics and Crashlytics disabled until the post-cutover track (section 15).

#### 6.11 pnpm Linker and Metro blockList

Native autolinking (Gradle/CocoaPods) does not traverse pnpm isolated node_modules well.

Steps:

1. Add to root .npmrc: node-linker=hoisted (add shamefully-hoist=true only if needed).
2. Keep apps/mobile-expo from colliding with apps/mobile in Metro via resolver.blockList (section 6.2).
3. Reinstall and rebuild native projects after changing the linker.

### 7. Navigation Migration Examples

#### 7.1 Replace useRouter with useNavigation

```tsx
// old
import { useRouter } from "expo-router";
const router = useRouter();
router.push("/(shared-screens)/students");

// new
import { useNavigation } from "@react-navigation/native";
const navigation = useNavigation<any>();
navigation.navigate("StudentsList");
```

#### 7.2 Replace Link wrappers

```tsx
// old
import { Link } from 'expo-router';
<Link href="/(auth)/forgot-password" asChild>
	<TouchableOpacity>
		<Text>Forgot Password?</Text>
	</TouchableOpacity>
</Link>

// new
<TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
	<Text>Forgot Password?</Text>
</TouchableOpacity>
```

#### 7.3 Replace useLocalSearchParams

```tsx
// old
import { useLocalSearchParams } from "expo-router";
const { id } = useLocalSearchParams<{ id: string }>();

// new
import { RouteProp, useRoute } from "@react-navigation/native";
type RootStackParamList = { StudentDetail: { id: string } };
const route = useRoute<RouteProp<RootStackParamList, "StudentDetail">>();
const { id } = route.params;
```

### 8. Module Replacement Examples

#### 8.1 Secure Store to Keychain

Target file: [educard-clients/apps/mobile/src/lib/auth-store.ts](educard-clients/apps/mobile/src/lib/auth-store.ts)

```tsx
// old
import * as SecureStore from "expo-secure-store";
await SecureStore.setItemAsync("accessToken", token);

// new
import * as Keychain from "react-native-keychain";
await Keychain.setGenericPassword("auth", token, { service: "accessToken" });
```

#### 8.2 Expo Image Picker to RN Image Picker

Target file: [educard-clients/apps/mobile/src/components/forms/FormPhotoUpload.tsx](educard-clients/apps/mobile/src/components/forms/FormPhotoUpload.tsx)

```tsx
// old
import * as ImagePicker from "expo-image-picker";
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ["images"],
});

// new
import { launchImageLibrary } from "react-native-image-picker";
const result = await launchImageLibrary({ mediaType: "photo" });
const uri = result.assets?.[0]?.uri;
```

#### 8.3 Expo Document Picker to RN Document Picker

Target file: [educard-clients/apps/mobile/src/components/forms/FormAttachmentPicker.tsx](educard-clients/apps/mobile/src/components/forms/FormAttachmentPicker.tsx)

```tsx
// old
import * as DocumentPicker from "expo-document-picker";
const result = await DocumentPicker.getDocumentAsync({});

// new
import DocumentPicker from "react-native-document-picker";
const result = await DocumentPicker.pickSingle({
  type: [DocumentPicker.types.allFiles],
});
```

#### 8.4 Expo FileSystem and Sharing to RN FS and Share

Target file: [educard-clients/apps/mobile/src/utils/download-template.ts](educard-clients/apps/mobile/src/utils/download-template.ts)

```tsx
// old
import * as Sharing from "expo-sharing";
await Sharing.shareAsync(fileUri);

// new
import Share from "react-native-share";
await Share.open({ url: `file://${filePath}` });
```

### 9. Navigation Structure Example

Create new navigator files under [educard-clients/apps/mobile/src/navigation](educard-clients/apps/mobile/src/navigation).

```tsx
// src/navigation/root-navigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthStack} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

Example linking config for future App Links and Universal Links:

```tsx
const linking = {
  prefixes: ["educard://", "https://app.educard.com"],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: "auth/login",
        },
      },
      MainTabs: {
        screens: {
          Dashboard: "dashboard",
          StudentsList: "students",
          StudentDetail: "students/:id",
        },
      },
    },
  },
};
```

Android App Links and iOS Universal Links implementation checklist:

1. Android: add intent-filter with autoVerify in AndroidManifest.xml.
2. Android: publish assetlinks.json on the domain.
3. iOS: enable Associated Domains entitlement.
4. iOS: publish apple-app-site-association on the domain.
5. Validate link open behavior for installed and non-installed app states.

### 9.1 Permission UX Implementation Standard

Use just-in-time prompts only when user initiates a capability.

Examples:

1. Camera permission requested only when user taps Capture Photo.
2. Location permission requested only when user opens location-based feature.
3. Notifications permission requested after onboarding rationale and when enabling notifications.

Implementation checklist:

1. Show short rationale UI before OS prompt.
2. Request permission on action path, not on app launch.
3. If denied, provide recover path with settings deep-link.
4. Log permission status for QA validation.

### 9.2 Permission Policy: Location, Contacts, and Basic Permissions

Permission groups and request strategy:

1. Location (sensitive): request only when user opens location-required flow such as attendance by geo-tag or map-based feature.
2. Contacts (sensitive): request only when user taps import/select from contacts.
3. Camera (sensitive): request only when user taps capture photo.
4. Photo/Media (sensitive): request only when user taps choose from gallery.
5. Notifications (sensitive): request after in-app explanation when user enables alerts.
6. Basic runtime-safe permissions (non-sensitive or install-time): declare in manifests as needed, do not prompt at app launch.

Basic permissions baseline (no startup popup):

1. Android: INTERNET, ACCESS_NETWORK_STATE.
2. iOS: no user popup equivalent for internet access.
3. Storage/media permissions are requested only when user triggers upload/download/export actions.

Contacts permission copy guideline:

1. Pre-prompt message: We use contacts only to help you quickly fill parent or guardian phone details.
2. Denied state action: continue manual entry and show Open Settings action.

Location permission copy guideline:

1. Pre-prompt message: We use your location only to validate location-based attendance actions.
2. Denied state action: disable location-gated action and show Open Settings action.

Platform permission keys checklist:

1. Android manifest keys to include only if feature is enabled: ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, READ_CONTACTS, CAMERA, POST_NOTIFICATIONS, READ_MEDIA_IMAGES.
2. iOS Info.plist keys to include only if feature is enabled: NSLocationWhenInUseUsageDescription, NSContactsUsageDescription, NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSPhotoLibraryAddUsageDescription, NSUserTrackingUsageDescription (only if tracking is used), and notification capability.

Implementation rule:

1. No sensitive permission request during app launch, splash, or login.
2. Trigger permission prompt from the user action handler where the feature starts.
3. If permission denied, keep app usable with fallback path.

### 10. Platform Commands

```bash
# Android debug
cd apps/mobile
pnpm android

# iOS debug
pnpm ios

# Android release build
cd android
./gradlew assembleRelease

# iOS release archive (example)
cd ../ios
xcodebuild -workspace EducardMobile.xcworkspace -scheme EducardMobile -configuration Release -sdk iphoneos -derivedDataPath build
```

### 11. CI Workflow Migration Commands and Example

Target file: [educard-clients/.github/workflows/mobile-build.yml](educard-clients/.github/workflows/mobile-build.yml)

Replace Expo EAS steps with native build steps:

```yaml
jobs:
	android-build:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- uses: pnpm/action-setup@v4
				with:
					version: 9
			- uses: actions/setup-node@v4
				with:
					node-version: 20
					cache: pnpm
			- name: Install deps
				run: pnpm install --frozen-lockfile
			- name: Build Android release
				working-directory: apps/mobile/android
				run: ./gradlew assembleRelease
			- name: Upload artifact
				uses: actions/upload-artifact@v4
				with:
					name: android-release-apk
					path: apps/mobile/android/app/build/outputs/apk/release/*.apk

	ios-build:
		runs-on: macos-latest
		steps:
			- uses: actions/checkout@v4
			- uses: pnpm/action-setup@v4
				with:
					version: 9
			- uses: actions/setup-node@v4
				with:
					node-version: 20
					cache: pnpm
			- name: Install deps
				run: pnpm install --frozen-lockfile
			- name: Install pods
				working-directory: apps/mobile/ios
				run: pod install
			- name: Build iOS
				working-directory: apps/mobile/ios
				run: xcodebuild -workspace EducardMobile.xcworkspace -scheme EducardMobile -configuration Release -sdk iphoneos -derivedDataPath build
```

Signing ownership implementation notes:

1. Android keystore and passwords stored as GitHub Actions encrypted secrets.
2. iOS certificates/profiles managed under EDUCARD-controlled secure storage and imported during CI runtime.
3. Access limited to release engineers and designated DevOps owners.

### 12. Validation Commands Per Phase

```bash
# run after each major migration step
pnpm --filter @educard/mobile lint
pnpm --filter @educard/mobile typecheck
pnpm --filter @educard/mobile test

# web must remain unaffected
pnpm --filter @educard/web lint
pnpm --filter @educard/web typecheck
pnpm --filter @educard/web build
```

### 13. Search Commands for Bulk Refactors

```bash
# find expo-router usage
rg "expo-router|useRouter|useLocalSearchParams|<Link|router\." apps/mobile/src apps/mobile/app

# find expo module usage
rg "from 'expo-|from \"expo-" apps/mobile

# find back handler and focus hooks
rg "useFocusEffect|BackHandler|router\.back" apps/mobile/src
```

### 14. Recommended Execution Order

1. Backup and scaffold first.
2. Build empty RN CLI app successfully on Android and iOS.
3. Migrate navigation shell and auth flow.
4. Migrate storage and environment config.
5. Migrate media and file features.
6. Migrate remaining feature screens.
7. Migrate CI and release.
8. Run full regression and cutover.
9. Start post-cutover track for Firebase Analytics and Crashlytics migration.

### 15. Post-Cutover Track: Firebase Analytics and Crashlytics

Objective: move analytics and crash reporting to Firebase ecosystem after stable RN CLI production release.

Implementation steps:

1. Configure Firebase apps for Android and iOS projects.
2. Add platform config files and verify app startup.
3. Introduce analytics event wrapper service to avoid direct SDK calls in screen code.
4. Migrate existing key events to Firebase Analytics event schema.
5. Enable Crashlytics collection by environment and wire user context metadata.
6. Add non-fatal error logging at critical failure boundaries.
7. Validate dashboards and alerting before decommissioning old analytics/crash tools.

Acceptance checklist:

1. Core funnels visible in Firebase Analytics.
2. Crash-free users/session metrics available in Crashlytics.
3. Critical non-fatal exceptions visible with route and feature metadata.
4. Release alerts configured for crash regression thresholds.

## Impact Matrix

1. Imports:
2. High impact: Expo Router and Expo native modules.
3. Medium impact: route typing and root config imports.
4. Low impact: shared business imports.
5. Components:
6. High impact: root layout, tab layouts, auth screens, dynamic detail screens.
7. Medium impact: feature lists with param-based navigation.
8. Low impact: visual-only components.
9. Buttons and handlers:
10. High impact: onPress handlers calling router methods.
11. Medium impact: reusable action controls fed by route strings.
12. Low impact: stateless buttons with callback props.
13. Functions:
14. High impact: redirect logic, route param parsing, file/media helpers.
15. Medium impact: focus and Android back handling hooks.
16. Low impact: API transform and utility functions.

## Exit Criteria Before Implementation

1. Clarifying questions answered and approved.
2. Replacement libraries approved.
3. Navigation naming and deep link policy approved.
4. Signing ownership approved.
5. Rollback window and cutover gates approved.

## Finalized Scope and Release Policy

1. First production release will be RN CLI only.
2. No production deep-link backward compatibility constraints exist.
3. Expo app retained only as branch-level fallback during migration.
4. Promotion to production requires internal QA, regression, and performance validation signoff.

## Reference Inputs

1. [migration.txt](migration.txt)
2. [educard-clients/apps/mobile/package.json](educard-clients/apps/mobile/package.json)
3. [educard-clients/apps/mobile/app.json](educard-clients/apps/mobile/app.json)
4. [educard-clients/apps/mobile/metro.config.js](educard-clients/apps/mobile/metro.config.js)
5. [educard-clients/apps/mobile/babel.config.js](educard-clients/apps/mobile/babel.config.js)
6. [educard-clients/.github/workflows/mobile-build.yml](educard-clients/.github/workflows/mobile-build.yml)
