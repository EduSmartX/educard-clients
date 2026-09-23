# EduCard Mobile — Android Local Testing & APK Build (React Native CLI)

Second time:
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
pnpm android

Second terminal
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile

ENVFILE=.env.production pnpm android

This guide covers how to run and test the **RN CLI** mobile app (`apps/mobile`) on Android
locally, and how to produce an installable **APK** — all with the plain React Native CLI /
Gradle toolchain. There is **no Expo / EAS** in this flow.

| Item           | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| App package    | `apps/mobile` (`@educard/mobile`)                          |
| Application ID | `com.educardmobile`                                        |
| React Native   | `0.83.6` (New Architecture + Hermes)                       |
| Gradle project | `apps/mobile/android` (rootProject `EducardMobile`)        |
| Env management | `react-native-config` (build type selects the `.env` file) |

---

## 🚨 IMPORTANT: First-time Setup (pnpm Monorepo Fix)

If you encounter errors like:

```
Error: Cannot find module '@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js'
```

This is because React Native's Gradle scripts expect certain packages in `apps/mobile/node_modules`, but pnpm hoists them to the workspace root by default. **Follow these steps before running the app:**

### Quick Fix (Recommended Order)

```bash
# 1. Navigate to workspace root
cd educard-clients

# 2. Clean everything
rm -rf node_modules apps/*/node_modules packages/*/node_modules pnpm-lock.yaml

# 3. Update .npmrc (creates shamefully-hoist config)
cat > .npmrc <<EOF
enable-pre-post-scripts=true
shamefully-hoist=true
EOF

# 4. Fresh install
pnpm install

# 5. Add @react-native/codegen as explicit dependency (if not already present)
cd apps/mobile
pnpm add -D @react-native/codegen@0.83.6

# 6. Clean Gradle cache
cd android
./gradlew clean

# 7. Now you can build
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
pnpm android
```

### Why This Is Needed

- **pnpm** uses a content-addressable store and symlinks packages
- **React Native's Gradle** scripts look for packages in `apps/mobile/node_modules/@react-native/*`
- **Solution**: Use `shamefully-hoist=true` in `.npmrc` to ensure all dependencies are hoisted to `apps/mobile/node_modules`

### Verification

After setup, verify the required file exists:

```bash
cd apps/mobile
ls node_modules/@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js
# Should print the file path without errors
```

---

## 1. Prerequisites

Install once on your machine (host or WSL — see [Section 7](#7-running-from-wsl-windows)).

| Tool           | Version                     | Notes                                                  |
| -------------- | --------------------------- | ------------------------------------------------------ |
| Node.js        | `>= 20`                     | Use the repo's `corepack` + `pnpm`.                    |
| JDK            | **17** (Temurin/OpenJDK 17) | RN 0.83 requires JDK 17. Set `JAVA_HOME`.              |
| Android SDK    | Platform **36**             | Install via Android Studio → SDK Manager.              |
| Build-Tools    | **36.0.0**                  | Matches `buildToolsVersion` in `android/build.gradle`. |
| NDK            | **27.1.12297006**           | Matches `ndkVersion` in `android/build.gradle`.        |
| Android device | Emulator (AVD) or physical  | Physical device needs **USB debugging** enabled.       |

Required environment variables (add to your shell profile):

```bash
export ANDROID_HOME="$HOME/Android/Sdk"          # or your SDK path
export PATH="$PATH:$ANDROID_HOME/platform-tools" # adb, etc.
export PATH="$PATH:$ANDROID_HOME/emulator"       # emulator CLI
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"  # adjust to your JDK 17 path
```

Verify the toolchain:

```bash
node -v          # >= 20
java -version    # 17.x
adb --version    # platform-tools present
```

---

## 2. One-time project setup

From the **repo root** (`educard-clients/`):

```bash
# 1. Install all workspace dependencies (pnpm monorepo)
corepack pnpm install

# 2. Create the mobile env files (gitignored - every machine needs its own)
cp apps/mobile/.env.example apps/mobile/.env.local        # local backend   -> DEBUG builds
cp apps/mobile/.env.example apps/mobile/.env.production   # EduCard backend -> RELEASE builds
```

Set `API_URL` in each file:

- `apps/mobile/.env.local` - local backend for development:

  ```env
  API_URL=http://10.0.2.2:8000/api
  APP_ENV=development
  ```

- `apps/mobile/.env.production` - hosted **EduCard** backend:

  ```env
  API_URL=https://educard-backend-api-272236662775.asia-south1.run.app/api
  APP_ENV=production
  ```

| Target           | `API_URL`                                   |
| ---------------- | ------------------------------------------- |
| Android emulator | `http://10.0.2.2:8000/api` (host localhost) |
| Physical device  | `http://<YOUR_LAN_IP>:8000/api`             |
| EduCard (hosted) | `https://educard-backend-api-…run.app/api`  |

> **Tip:** `10.0.2.2` is the special alias the Android emulator uses to reach the host
> machine's `localhost`. A physical device must use your computer's LAN IP.

### 2.1 Choosing the backend: local ↔ EduCard

`android/app/build.gradle` wires `react-native-config` to pick the env file **automatically by
build type**, so the normal flow needs **no flags**:

| Build type                      | Env file          | Backend          |
| ------------------------------- | ----------------- | ---------------- |
| **debug** (`pnpm android`)      | `.env.local`      | local            |
| **release** (`assembleRelease`) | `.env.production` | EduCard (hosted) |

To **override** the file for a single command (e.g. run a debug build against EduCard), set
`ENVFILE`:

```bash
# bash / macOS / Linux / WSL
ENVFILE=.env.production corepack pnpm --filter @educard/mobile android
```

```powershell
# Windows PowerShell
$env:ENVFILE=".env.production"; corepack pnpm --filter @educard/mobile android
```

```bat
:: Windows cmd
set ENVFILE=.env.production && corepack pnpm --filter @educard/mobile android
```

> Env values are baked in at **build time**. After editing a `.env` file or changing
> `ENVFILE`, **rebuild** the app (re-run `pnpm android` / `gradlew`); Fast Refresh alone will
> not pick up a new URL.

> **Which backend runs where:** for the **EduCard (hosted)** backend you don't run anything
> locally. For a **local** backend, start the Django API first (see
> [LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md)) and point `API_URL` at your machine
> (`10.0.2.2` for the emulator, your LAN IP for a physical device).

---

## 3. Test locally on Android (debug)

Two terminals from the repo root.

**Terminal A — start Metro (JS bundler):**

```bash
corepack pnpm --filter @educard/mobile start
```

**Terminal B — build & launch the debug app on the running emulator/device:**

```bash
# debug build → automatically uses .env.local (local backend)
corepack pnpm --filter @educard/mobile android

# …or point this debug build at the EduCard backend for one run
ENVFILE=.env.production corepack pnpm --filter @educard/mobile android
```

This runs `react-native run-android`, which compiles the debug variant, installs it, and
launches it. Save a file and **Fast Refresh** updates the app instantly.

### Physical device over USB

```bash
adb devices                      # confirm your device is listed & authorized
adb reverse tcp:8081 tcp:8081    # let the device reach Metro on the host
# if the backend runs on the host too:
adb reverse tcp:8000 tcp:8000    # then API_URL can be http://localhost:8000/api
```

### Dev menu / reload

- Open the dev menu: shake the device, or `adb shell input keyevent 82`.
- Force reload: press **R** twice in the dev menu.
- Reset the Metro cache if bundling gets stuck:
  ```bash
  corepack pnpm --filter @educard/mobile start --reset-cache
  ```

---

## 4. Build a debug APK (shareable for quick testing)

A debug APK is self-signed with the checked-in `debug.keystore`, so it installs on any
device without extra setup. It bundles the JS, so it runs **without** a Metro server.

```bash
cd apps/mobile/android
./gradlew assembleDebug
```

Output:

```
apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a connected device:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. Build a release APK (as per React Native CLI)

The release variant runs Hermes bytecode, is minified-ready, and bundles the JS. By default
this project's `release` build type is **signed with the debug key** (see
`android/app/build.gradle`). That is fine for **internal distribution / QA**, but **not** for
the Play Store — use a real keystore ([Section 6](#6-production-signing-real-keystore)) for
that.

```bash
cd apps/mobile/android

# release build → automatically uses .env.production (EduCard backend)
./gradlew assembleRelease
```

Output:

```
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Install / share:

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

### Android App Bundle (`.aab`) for the Play Store

```bash
./gradlew bundleRelease
# → app/build/outputs/bundle/release/app-release.aab
```

### Faster / smaller builds

```bash
# build only the ABIs you need (e.g. modern arm64 devices)
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a

# always start clean if a previous build is misbehaving
./gradlew clean
```

---

## 6. Production signing (real keystore)

Do this before publishing. **Never commit the keystore or its passwords.**

**a. Generate an upload keystore:**

```bash
cd apps/mobile/android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore educard-upload.keystore \
  -alias educard-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

**b. Add credentials to `~/.gradle/gradle.properties`** (user-level, outside the repo):

```properties
EDUCARD_UPLOAD_STORE_FILE=educard-upload.keystore
EDUCARD_UPLOAD_KEY_ALIAS=educard-upload
EDUCARD_UPLOAD_STORE_PASSWORD=*****
EDUCARD_UPLOAD_KEY_PASSWORD=*****
```

**c. Wire it up in `apps/mobile/android/app/build.gradle`:**

```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('EDUCARD_UPLOAD_STORE_FILE')) {
                storeFile file(EDUCARD_UPLOAD_STORE_FILE)
                storePassword EDUCARD_UPLOAD_STORE_PASSWORD
                keyAlias EDUCARD_UPLOAD_KEY_ALIAS
                keyPassword EDUCARD_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release   // was signingConfigs.debug
        }
    }
}
```

Also bump `versionCode` / `versionName` in `defaultConfig` for each release. Reference:
<https://reactnative.dev/docs/signed-apk-android>.

---

## 7. Running from WSL / Windows

This repo lives under WSL (`\\wsl$\Ubuntu\root\workspace`), so `node_modules` and pnpm are
installed inside WSL. Run Metro **and** Gradle in the **same** environment where the
dependencies live (WSL) to avoid path/symlink issues.

Recommended setup inside WSL (Ubuntu):

```bash
# JDK 17 + Android command-line tools + platform 36 in WSL, then:
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
```

Connecting a **physical device** to WSL:

- **Wi‑Fi (simplest):** enable wireless debugging on the phone, then
  `adb connect <device-ip>:5555` from WSL.
- **USB:** attach the USB device to WSL with
  [`usbipd-win`](https://learn.microsoft.com/windows/wsl/connect-usb), then `adb devices`.

Alternatively, open `apps/mobile/android` directly in **Android Studio** (Windows) and build
from there — but Metro/JS must still be bundled from the environment holding `node_modules`
(release Gradle builds bundle JS automatically, so a release APK from Android Studio works
without a running Metro).

---

## 8. Troubleshooting

| Symptom                                                                           | Fix                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cannot find module '@react-native/codegen/lib/cli/combine/...`                   | **pnpm monorepo issue** → See [Section 0 (First-time Setup)](#-important-first-time-setup-pnpm-monorepo-fix) above. Ensure `.npmrc` has `shamefully-hoist=true`, clean install, add `@react-native/codegen`.                                                  |
| `GuardedResultAsyncTask` error in `react-native-document-picker`                  | Package deprecated → Remove old package and install new one: `pnpm remove react-native-document-picker && pnpm add @react-native-documents/picker`, then update imports in your code from `react-native-document-picker` to `@react-native-documents/picker`. |
| `SDK location not found`                                                          | Create `apps/mobile/android/local.properties` with `sdk.dir=/path/to/Android/Sdk`, or set `ANDROID_HOME`.                                                                                                                                                     |
| `Unsupported class file major version` / Gradle JDK                               | Ensure `JAVA_HOME` points to **JDK 17**.                                                                                                                                                                                                                      |
| App can't reach the API                                                           | Emulator → `10.0.2.2`; device → LAN IP or `adb reverse tcp:8000 tcp:8000`.                                                                                                                                                                                    |
| Red screen: "Unable to load script"                                               | Metro not running / not reachable → start Metro and run `adb reverse tcp:8081 tcp:8081`.                                                                                                                                                                      |
| Stale JS after changes                                                            | `pnpm --filter @educard/mobile start --reset-cache`.                                                                                                                                                                                                          |
| Firebase `No Firebase App '[DEFAULT]'`                                            | Add `android/app/google-services.json` and apply the `com.google.gms.google-services` Gradle plugin.                                                                                                                                                          |
| Corrupt/leftover build                                                            | `cd apps/mobile/android && ./gradlew clean` then rebuild.                                                                                                                                                                                                     |
| Node.js v24 compatibility issues                                                  | React Native works best with Node 18 or 20. Consider using `nvm` to switch: `nvm use 20`.                                                                                                                                                                     |
| D8 warnings about `play-services-auth` stack maps                                 | These are **harmless warnings** from Google Play Services libraries. They don't affect the build or app functionality. Safe to ignore.                                                                                                                        |
| `react-native-vector-icons` or `react-native-document-picker` deprecated warnings | These packages have been renamed/reorganized. The app will still work, but consider migrating to the new packages when convenient. See package documentation for migration guides.                                                                            |
| **Metro Error: "Unable to resolve module @/lib/query-client"**                    | **Path alias issue** → TypeScript `@/` alias not configured in Babel. Install `babel-plugin-module-resolver` and configure it (see below).                                                                                                                    |
| **"device is still booting" during `pnpm android`**                               | Emulator wasn't fully ready when Gradle tried to install. Wait 30-60 seconds, then manually install: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`                                                                                       |
| **"Unable to resolve module react-native-document-picker"**                       | **Package migration incomplete** → See [Section 8.2](#82-migrating-from-react-native-document-picker-to-react-native-documentspicker) below for complete migration steps.                                                                                     |
| **"protocol fault" or "Connection refused" when pairing phone**                   | **ADB version/protocol mismatch** → See [Section 8.3](#83-connecting-physical-device-for-testing) for USB and wireless connection methods.                                                                                                                    |

### 8.1 Fixing Path Alias Resolution (@/ imports)

If you see Metro bundler error: **"Unable to resolve module @/lib/query-client"**

This means the TypeScript path alias (`@/*` → `src/*`) isn't configured for Metro. Fix:

```bash
# 1. Install babel-plugin-module-resolver
cd apps/mobile
pnpm add -D babel-plugin-module-resolver

# 2. Update babel.config.js to include the alias
```

Your `babel.config.js` should look like:

```javascript
module.exports = {
  presets: [
    ["@react-native/babel-preset", { jsxImportSource: "nativewind" }],
    "nativewind/babel",
  ],
  plugins: [
    "react-native-worklets/plugin",
    [
      "module-resolver",
      {
        root: ["./src"],
        alias: {
          "@": "./src",
        },
      },
    ],
  ],
};
```

```bash
# 3. Reset Metro cache and restart
pnpm start --reset-cache

# 4. In another terminal, rebuild and run
cd apps/mobile
ENVFILE=.env.production pnpm android
```

---

### 8.2 Migrating from react-native-document-picker to @react-native-documents/picker

**Error:** `Unable to resolve module react-native-document-picker`

**Cause:** The package was deprecated and renamed. Old imports still reference the deprecated package.

**Fix:** Update all imports to use the new package API:

```bash
# Package already installed as @react-native-documents/picker
# Just need to update imports in code
```

**Old Import (deprecated):**

```typescript
import DocumentPicker, { types, isCancel } from "react-native-document-picker";

// Usage:
const result = await DocumentPicker.pickSingle({
  type: [types.pdf],
  copyTo: "cachesDirectory",
});
if (isCancel(error)) return;
```

**New Import (correct):**

```typescript
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from "@react-native-documents/picker";

// Usage:
const result = await pick({
  type: [types.pdf],
  copyToCacheDirectory: true,
  allowMultiSelection: false,
});
if (!result || result.length === 0) return;
const file = result[0]; // pick() returns array
if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED)
  return;
```

**Key API Changes:**

- ❌ `DocumentPicker.pickSingle()` → ✅ `pick()` (returns array, use `[0]` for single file)
- ❌ `isCancel(error)` → ✅ `isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED`
- ❌ `copyTo: 'cachesDirectory'` → ✅ `copyToCacheDirectory: true`
- ❌ `asset.fileCopyUri` → ✅ `asset.uri` (already the cached path)
- ❌ Default export → ✅ Named exports only

**Files to update (already fixed in this project):**

- `src/components/common/BulkUploadModal.tsx`
- `src/components/forms/FormAttachmentPicker.tsx`
- `src/screens/shared/student/StudentHomeworkDetailScreen.tsx`

---

### 8.3 Connecting Physical Device for Testing

#### Option 1: USB Cable (RECOMMENDED - Most Reliable)

**Step 1: Enable Developer Options on Samsung/Android Phone**

1. **Settings** → **About phone** → Tap **Build number** 7 times
2. You'll see "Developer mode enabled"

**Step 2: Enable USB Debugging**

1. **Settings** → **Developer options**
2. Enable **USB debugging**
3. Enable **Install via USB** (if available)

**Step 3: Connect & Authorize**

```bash
# Connect phone via USB cable
# Phone will show authorization dialog - tap "Allow"
# Check "Always allow from this computer" for convenience

# Verify connection
adb devices

# Should show:
# List of devices attached
# R3CR70KYDNH    device
```

**Step 4: Run the App**

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
ENVFILE=.env.production pnpm android
# App will automatically install to connected phone
```

---

#### Option 2: Wireless Debugging (Android 11+)

**Why "Connection refused" and "protocol fault" errors occur:**

1. **Connection refused (port 5555):** You tried to connect before pairing, or used wrong IP/port
2. **Protocol fault during pairing:** ADB version mismatch between Mac and Android device
   - Your ADB: `1.0.41` (Version 37.0.0) from Android SDK Platform-Tools
   - Phone's ADB: Might be different version causing protocol incompatibility
3. **Wrong port:** Pairing port (e.g., `43311`) ≠ Connection port (e.g., `5555`)

**Step 1: Enable Wireless Debugging**

1. **Settings** → **Developer options**
2. Enable **Wireless debugging**
3. Tap **Wireless debugging** to open the screen
4. Keep this screen open during pairing

**Step 2: Pair Device (One-time Setup)**

```bash
# On phone: Tap "Pair device with pairing code"
# Note the 6-digit code AND the IP:Port shown
# Example: Code: 561159, IP: 192.168.31.96:43311

# On Mac terminal:
adb pair 192.168.31.96:43311
# Enter: 561159 (when prompted)
```

**If pairing fails with "protocol fault" error:**

Your ADB version (37.0.0) should work, but if issues persist:

```bash
# Option A: Update platform-tools via SDK Manager
# Android Studio → Tools → SDK Manager → SDK Tools →
# Check "Android SDK Platform-Tools" → Apply

# Option B: Install via Homebrew (gets latest version)
brew install android-platform-tools

# Option C: Manual download
# Visit: https://developer.android.com/tools/releases/platform-tools
# Download, extract, update PATH to use new adb
```

**Step 3: Connect to Device**

```bash
# After successful pairing, go back to "Wireless debugging" screen
# Look for "IP address & Port" at the TOP (NOT the pairing port!)
# Example: 192.168.31.96:5555

adb connect 192.168.31.96:5555

# Verify connection
adb devices
# Should show:
# 192.168.31.96:5555    device
```

**Step 4: Run the App**

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
ENVFILE=.env.production pnpm android
```

**Troubleshooting Wireless Connection:**

| Issue                           | Solution                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Connection refused`            | Ensure both Mac and phone on same WiFi network. Use the connection port (5555), not pairing port.         |
| `protocol fault` during pairing | Update ADB to latest version (see commands above). Alternatively, use USB cable method.                   |
| `unauthorized`                  | Check phone screen for authorization popup. Tap "Allow" and check "Always allow".                         |
| Connection drops frequently     | Wireless debugging auto-disables after inactivity. Re-enable in Developer options. Use USB for stability. |
| Multiple devices showing        | Specify device: `adb -s 192.168.31.96:5555 install -r app-debug.apk`                                      |

**Important Notes:**

- **Pairing port** (e.g., `43311`) is ONLY for initial pairing (one-time)
- **Connection port** (e.g., `5555`) is for all subsequent connections
- You must pair each time you disable/re-enable Wireless debugging
- Both devices must be on the same WiFi network
- USB cable method is more stable for active development

---

## 9. Command cheat sheet

```bash
# --- from repo root (educard-clients/) ---
corepack pnpm install                                   # install deps
corepack pnpm --filter @educard/mobile start            # Metro
corepack pnpm --filter @educard/mobile android          # debug run → local backend (.env.local)

# --- from apps/mobile/android ---
./gradlew assembleDebug                                 # debug APK  → local backend (.env.local)
./gradlew assembleRelease                               # release APK → EduCard (.env.production)
./gradlew bundleRelease                                 # release AAB → EduCard (.env.production)
./gradlew clean                                         # clean build

# --- ADB device management ---
adb devices                                             # list connected devices
adb devices -l                                          # list with device details
adb kill-server && adb start-server                    # restart adb server

# --- USB device connection ---
adb devices                                             # verify phone appears as "device"
adb -s DEVICE_ID install -r app-debug.apk              # install to specific device

# --- Wireless debugging (Android 11+) ---
adb pair 192.168.31.96:43311                           # pair with code (one-time)
adb connect 192.168.31.96:5555                         # connect to paired device
adb disconnect 192.168.31.96:5555                      # disconnect wireless device

# --- Install / inspect ---
adb install -r app/build/outputs/apk/debug/app-debug.apk      # install debug APK
adb install -r app/build/outputs/apk/release/app-release.apk  # install release APK
adb uninstall com.educardmobile                                # uninstall app
adb shell pm list packages | grep educard                      # check if app installed
adb logcat | grep ReactNative                                  # view React Native logs

# --- Port forwarding (for physical device to reach local backend) ---
adb reverse tcp:8000 tcp:8000                          # map device:8000 → host:8000
adb reverse tcp:8081 tcp:8081                          # map device:8081 → Metro
adb reverse --list                                     # list all reverse mappings
adb reverse --remove-all                               # clear all mappings
```

Build outputs:

- Debug APK → `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK → `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Release AAB → `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`
