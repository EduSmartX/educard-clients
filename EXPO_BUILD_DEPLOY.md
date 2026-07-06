# EduCard Mobile — Pushing Changes to Expo & Building an APK

Self-contained guide for the two ways to get your local mobile changes onto a device/tester,
and how to generate an installable Android APK. Covers the **EAS CLI** login flow, **OTA
updates** (push JS changes instantly, no rebuild), and **native builds** (APK/AAB generation).

**Location:** all commands below run from `educard-clients/apps/mobile/`.

> Note: I updated `eas.json` (at the `educard-clients/` root) so `development` and `preview`
> profiles explicitly build an installable **APK** (`android.buildType: "apk"`), and added a new
> `production-apk` profile (production config, but APK instead of Play Store's AAB format). This
> was previously documented in `DEPLOYMENT_GUIDE.md` but wasn't actually present in `eas.json` —
> it's fixed now so the commands below actually work as described.

---

## 1. One-time setup: install & log in to EAS

```bash
# Install the EAS CLI globally (once per machine)
npm install -g eas-cli

# Verify install
eas --version

# Log in with your Expo account (opens browser or prompts username/password)
eas login

# Confirm you're logged in, and as which account
eas whoami

# Log out (if needed, e.g. switching accounts)
eas logout
```

This project is already linked to an Expo project (see `app.json` → `extra.eas.projectId` and
`owner: "vinodreddem"`). If you're a new team member without access, ask the project owner to
invite you: **expo.dev → project → Settings → Members**.

---

## 2. Two ways to "push" local changes

| Method                 | Use when                                                                                                                               | Requires new install?                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **`eas update`** (OTA) | You only changed JS/TS code, assets, or styles — no new native module, no `app.json` native config change                              | No — existing installed app fetches it automatically |
| **`eas build`**        | You added/changed a native dependency, changed `app.json` native config (permissions, icons, plugins), or need a fresh installable APK | Yes — new APK/AAB must be installed                  |

### 2.1 Push an OTA update (`eas update`)

This publishes your current JS bundle to Expo's update server; any installed build on a matching
**channel** picks it up next time it launches (no app store / reinstall needed).

```bash
cd ~/workspace/educard-clients/apps/mobile

# Publish an update to a branch (creates the branch if it doesn't exist)
eas update --branch preview --message "Fix student dashboard crash"

# Publish to production branch
eas update --branch production --message "Description of the change"

# Auto-detect branch from current git branch name
eas update --auto
```

Useful follow-ups:

```bash
# List updates published to a branch
eas update:list --branch preview

# View a specific update's details
eas update:view <update-id>

# Roll back by re-publishing an older update, or delete one
eas update:delete <update-id>

# List/manage channels (a channel maps a build to which update branch it listens to)
eas channel:list
eas channel:view <channel-name>
```

> **Important**: For an installed build to actually receive an OTA update, its EAS **channel**
> must match the branch you publish to. This repo's `eas.json` build profiles don't currently
> declare an explicit `"channel"` — by default EAS uses the profile name as the channel. So:
>
> - Builds made with `--profile preview` listen on channel `preview` → publish with
>   `eas update --branch preview`
> - Builds made with `--profile production` (or `production-apk`) listen on channel `production` →
>   publish with `eas update --branch production`

### 2.2 Full native rebuild (`eas build`)

Required for native/config changes. See §3 below for the exact commands per profile.

---

## 3. Generating an APK

### 3.1 Cloud build (recommended — no Android SDK needed locally)

```bash
cd ~/workspace/educard-clients/apps/mobile

# Quick internal-testing APK (development client, debug-ish)
eas build --platform android --profile development

# Internal-testing APK (release-optimized, no dev menu)
eas build --platform android --profile preview

# Production-config APK (release-signed, still an installable .apk not a Play Store .aab)
eas build --platform android --profile production-apk

# Production AAB (what you'd actually submit to the Play Store)
eas build --platform android --profile production
```

The CLI prints a build URL (expo.dev) with live logs; when it finishes it also prints a
download link, and you can scan a QR code to install directly on a connected/linked device.

```bash
# List your recent builds
eas build:list

# View one build's details/logs
eas build:view <build-id>

# Download the finished artifact (APK/AAB) to your machine
eas build:download --platform android --latest

# Cancel a running build
eas build:cancel <build-id>
```

### 3.2 Local build (no EAS cloud, needs Android SDK installed)

```bash
cd ~/workspace/educard-clients/apps/mobile

# Same profiles as above, but built on your machine instead of Expo's servers
eas build --platform android --profile preview --local
```

### 3.3 Fully manual (no EAS at all — plain Gradle)

```bash
cd ~/workspace/educard-clients/apps/mobile

# Generate the native android/ project from the Expo config
npx expo prebuild --platform android

cd android

# Debug APK (unsigned, fast, for local testing only)
./gradlew assembleDebug
# -> android/app/build/outputs/apk/debug/app-debug.apk

# Release APK (needs a signing keystore configured in android/app/build.gradle)
./gradlew assembleRelease
# -> android/app/build/outputs/apk/release/app-release.apk
```

> Prefer §3.1 (cloud build) unless you specifically need to debug the native Android project —
> EAS handles signing/keystores for you automatically.

---

## 4. Installing the APK

- **Cloud build**: open the build URL from the terminal/expo.dev on your Android phone and tap
  "Install", or scan the QR code EAS prints after the build finishes.
- **Downloaded file**: `adb install path/to/app.apk` (device connected via USB with USB debugging
  enabled), or transfer the `.apk` file to the phone and open it (allow "install unknown apps" if
  prompted).

---

## 5. Typical release workflow (end to end)

```bash
cd ~/workspace/educard-clients/apps/mobile

# 1. Make your JS/TS changes, test locally with `npx expo start`

# 2. Bump version if needed (app.json -> expo.version), commit your changes

# 3a. JS-only change -> OTA update to testers already on a build:
eas update --branch preview --message "What changed"

# 3b. Native/config change, or first-time distribution -> new build:
eas build --platform android --profile preview

# 4. Share the build/download link (or APK file) with testers
```

---

## 6. Troubleshooting

| Symptom                                                    | Fix                                                                                                                                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eas: command not found`                                   | `npm install -g eas-cli` (or `npx eas-cli <command>` without a global install)                                                                                              |
| `eas login` fails / hangs in WSL                           | Use `eas login --username --password` non-interactively, or run the login step from a regular terminal that can open a browser                                              |
| Build succeeds but app crashes / update not applied        | Check the installed build's channel (`eas channel:view <channel>`) matches the branch you published with `eas update`                                                       |
| `eas build --profile preview` produced a `.aab` not `.apk` | Confirm `eas.json`'s `preview`/`development` profiles have `"android": {"buildType": "apk"}` (already added — see note at top of this doc)                                  |
| Need to change API URL for a build                         | Edit `apps/mobile/.env.production` (or the relevant env file) before running `eas build` — env vars starting with `EXPO_PUBLIC_` get baked into the JS bundle at build time |
| Local Gradle build fails                                   | Make sure Android SDK + `ANDROID_HOME` are set up; prefer the cloud build (§3.1) to avoid this entirely                                                                     |
