# EduCard Mobile — Android Local Testing & APK Build (React Native CLI)

This guide covers how to run and test the **RN CLI** mobile app (`apps/mobile`) on Android
locally, and how to produce an installable **APK** — all with the plain React Native CLI /
Gradle toolchain. There is **no Expo / EAS** in this flow (the old Expo app is kept only for
reference at `apps/mobile-expo`; see [MOBILE_EAS_APK_SETUP.md](./MOBILE_EAS_APK_SETUP.md) for
the legacy EAS process).

| Item           | Value                                               |
| -------------- | --------------------------------------------------- |
| App package    | `apps/mobile` (`@educard/mobile`)                   |
| Application ID | `com.educardmobile`                                 |
| React Native   | `0.83.6` (New Architecture + Hermes)                |
| Gradle project | `apps/mobile/android` (rootProject `EducardMobile`) |
| Env management | `react-native-config` (`ENVFILE` selects `.env.*`)  |

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

# 2. Create your local env file for the mobile app
cp apps/mobile/.env.example apps/mobile/.env.local
```

Then edit `apps/mobile/.env.local` and set `API_URL` for how you run the app:

| Target             | `API_URL`                                   |
| ------------------ | ------------------------------------------- |
| Android emulator   | `http://10.0.2.2:8000/api` (host localhost) |
| Physical device    | `http://<YOUR_LAN_IP>:8000/api`             |
| Staging/Production | the deployed backend `https://…/api`        |

> **Tip:** `10.0.2.2` is the special alias the Android emulator uses to reach the host
> machine's `localhost`. A physical device must use your computer's LAN IP.

---

## 3. Test locally on Android (debug)

Two terminals from the repo root.

**Terminal A — start Metro (JS bundler):**

```bash
corepack pnpm --filter @educard/mobile start
```

**Terminal B — build & launch the debug app on the running emulator/device:**

```bash
# default env file (.env)
corepack pnpm --filter @educard/mobile android

# …or pick an explicit env file (react-native-config)
ENVFILE=.env.local corepack pnpm --filter @educard/mobile android
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

# release APK with the production env file
ENVFILE=.env.production ./gradlew assembleRelease
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
ENVFILE=.env.production ./gradlew bundleRelease
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

| Symptom                                             | Fix                                                                                                       |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `SDK location not found`                            | Create `apps/mobile/android/local.properties` with `sdk.dir=/path/to/Android/Sdk`, or set `ANDROID_HOME`. |
| `Unsupported class file major version` / Gradle JDK | Ensure `JAVA_HOME` points to **JDK 17**.                                                                  |
| App can't reach the API                             | Emulator → `10.0.2.2`; device → LAN IP or `adb reverse tcp:8000 tcp:8000`.                                |
| Red screen: "Unable to load script"                 | Metro not running / not reachable → start Metro and run `adb reverse tcp:8081 tcp:8081`.                  |
| Stale JS after changes                              | `pnpm --filter @educard/mobile start --reset-cache`.                                                      |
| Firebase `No Firebase App '[DEFAULT]'`              | Add `android/app/google-services.json` and apply the `com.google.gms.google-services` Gradle plugin.      |
| Corrupt/leftover build                              | `cd apps/mobile/android && ./gradlew clean` then rebuild.                                                 |

---

## 9. Command cheat sheet

```bash
# --- from repo root (educard-clients/) ---
corepack pnpm install                                   # install deps
corepack pnpm --filter @educard/mobile start            # Metro
ENVFILE=.env.local corepack pnpm --filter @educard/mobile android   # run debug on device

# --- from apps/mobile/android ---
./gradlew assembleDebug                                 # debug APK
ENVFILE=.env.production ./gradlew assembleRelease       # release APK
ENVFILE=.env.production ./gradlew bundleRelease         # release AAB (Play Store)
./gradlew clean                                         # clean build

# --- install / inspect ---
adb devices
adb install -r app/build/outputs/apk/release/app-release.apk
```

Build outputs:

- Debug APK → `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK → `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- Release AAB → `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`
