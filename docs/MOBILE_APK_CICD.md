# Mobile APK CI/CD Setup

This setup creates an Android APK automatically on each development push, so testers can install and validate quickly.

## What Is Configured

- Workflow file: .github/workflows/mobile-apk-build.yml
- Trigger branches: develop, development
- Build system: React Native CLI + Gradle (no Expo, no EAS, no external build account)
- Build behavior: non-blocking checks (lint/typecheck can fail, build still runs)
- Signing: shared release keystore when secrets are present, debug keystore fallback otherwise
- Output: downloadable APK artifact in GitHub Actions

## Build Flow

1. Push code to develop or development.
2. GitHub Actions runs optional mobile checks.
3. Workflow generates apps/mobile/.env.production from secret values.
4. Workflow decodes the release keystore (if configured).
5. Gradle builds Android release APK from apps/mobile/android.
6. Workflow uploads APK as artifact.
7. Testers download the APK from the workflow run and install it.

## One-Time Setup: Release Keystore

We use **one keystore for every release build** (internal/dev and production). This keeps a single
signing identity, so testers upgrade in place instead of uninstalling, and the same key is reused
for Play Store later.

> Losing this file means you can never publish an update to an existing app. Back it up in a
> password manager or secure vault before anything else.

### 1. Generate the keystore (once, on any machine with a JDK)

```bash
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias educard \
  -keyalg RSA -keysize 2048 -validity 10000
```

`keytool` ships with the JDK. Answer the prompts and remember the store password, alias, and key
password — those become three of the four secrets below.

### 2. Convert it to base64 (GitHub secrets only store text)

```bash
# Linux / WSL
base64 -w 0 release.keystore

# macOS
base64 -i release.keystore | tr -d '\n'
```

Copy the single-line output into the `ANDROID_KEYSTORE_BASE64` secret.

### 3. Add the secrets

Repository secrets page:
<https://github.com/EduSmartX/educard-clients/settings/secrets/actions>

Use **New repository secret** for each entry in the table below.

Reference docs:

- Android app signing: <https://developer.android.com/studio/publish/app-signing>
- React Native signed APK: <https://reactnative.dev/docs/signed-apk-android>
- GitHub encrypted secrets: <https://docs.github.com/en/actions/security-guides/encrypted-secrets>

## Required GitHub Secrets

| Secret                      | Used by          | Purpose                                                                                                           |
| --------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| `MOBILE_API_URL_DEV`        | Mobile APK build | Backend API URL baked into the dev APK. Must include the `/api` suffix and be reachable from the public internet. |
| `ANDROID_KEYSTORE_BASE64`   | Mobile APK build | Base64 of `release.keystore`. Omit to fall back to debug signing.                                                 |
| `ANDROID_KEYSTORE_PASSWORD` | Mobile APK build | Keystore store password.                                                                                          |
| `ANDROID_KEY_ALIAS`         | Mobile APK build | Key alias, e.g. `educard`.                                                                                        |
| `ANDROID_KEY_PASSWORD`      | Mobile APK build | Key password for that alias.                                                                                      |
| `VERCEL_TOKEN`              | Web deploy       | Vercel CLI auth token.                                                                                            |
| `VERCEL_ORG_ID`             | Web deploy       | Vercel organization ID.                                                                                           |
| `VERCEL_PROJECT_ID_DEV`     | Web deploy       | Vercel dev project ID.                                                                                            |
| `VERCEL_PROJECT_ID_PROD`    | Web deploy       | Vercel prod project ID.                                                                                           |
| `VITE_API_BASE_URL_DEV`     | Web deploy       | Backend API URL for the Vercel dev build.                                                                         |
| `VITE_API_BASE_URL_PROD`    | Web deploy       | Backend API URL for the Vercel prod build.                                                                        |

The four `ANDROID_*` secrets are consumed **only inside the CI build**. They are never bundled into
the APK and are never needed on a tester's device.

### Example values for `MOBILE_API_URL_DEV`

| Scenario                                              | Value                             |
| ----------------------------------------------------- | --------------------------------- |
| Hosted dev backend (required for real device testing) | `https://dev-api.example.com/api` |
| Android emulator against local backend                | `http://10.0.2.2:8000/api`        |
| iOS simulator against local backend                   | `http://localhost:8000/api`       |
| Physical device on the same Wi-Fi                     | `http://192.168.1.25:8000/api`    |

An APK meant to "work on any Android phone anywhere" must point at a publicly reachable HTTPS URL.
Localhost and LAN addresses only resolve on the machine or network that hosts them.

## How Testers Get the APK

1. Open the Actions tab: <https://github.com/EduSmartX/educard-clients/actions>
2. Open the latest **Mobile APK Build** workflow run.
3. Download the artifact named `educard-mobile-dev-release-apk`.
4. Unzip it and share `educard-mobile-dev-release.apk`.
5. On the device, allow "Install unknown apps" for the browser or file manager, then tap the APK.

The run summary states which signing mode was used, so you can confirm the build was signed with
the release keystore rather than the debug fallback.

## Local Builds

```bash
cd apps/mobile/android

# Debug build against .env.local
./gradlew assembleDebug

# Release APK against .env.production
./gradlew assembleRelease
```

Output: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

Without the `ANDROID_*` environment variables set locally, the release build is signed with the
debug key. To sign locally with the shared keystore, export them first:

```bash
export ANDROID_KEYSTORE_PATH=app/release.keystore
export ANDROID_KEYSTORE_PASSWORD='...'
export ANDROID_KEY_ALIAS=educard
export ANDROID_KEY_PASSWORD='...'
```

`ANDROID_KEYSTORE_PATH` is resolved relative to `apps/mobile/android/app`.

## Production: Play Store Release

Play Store distributes an **AAB** (Android App Bundle), not an APK.

### 1. Create the Play Console account

- Sign up: <https://play.google.com/console/signup>
- Console: <https://play.google.com/console>

A one-time registration fee applies. Create the app entry and reserve the package name
`com.educardmobile` before the first upload.

### 2. Point the build at the production backend

Set `API_URL` in `apps/mobile/.env.production` to the production API URL (including `/api`).
In CI this comes from a secret; locally, edit the file directly.

### 3. Bump the version

Edit `apps/mobile/android/app/build.gradle`:

- `versionCode` must increase on every upload (integer).
- `versionName` is the human-readable version, e.g. `1.0.1`.

Play rejects an upload whose `versionCode` matches or is lower than an existing release.

### 4. Build the signed AAB

```bash
cd apps/mobile/android
./gradlew clean bundleRelease
```

Output: `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`

The same keystore env vars used for APK signing apply here.

### 5. Upload

In the Play Console, choose a track and upload the AAB:

- **Internal testing** — fastest, up to 100 testers, minimal review.
- **Closed / Open testing** — wider audience, full review.
- **Production** — public release.

### 6. Play App Signing

Google re-signs your app with a key it manages; your keystore becomes the **upload key**. Details:
<https://developer.android.com/studio/publish/app-signing#app-signing-google-play>

If the upload key is ever lost, it can be reset through Play Console support — but the app signing
key cannot. Keep the keystore backed up regardless.

### 7. Optional: automate uploads

Uploading can be automated with a Google Play service account:

- Getting started: <https://developers.google.com/android-publisher/getting_started>
- Service accounts: <https://console.cloud.google.com/iam-admin/serviceaccounts>

Store the generated JSON key as a GitHub secret and add a workflow targeting `main`/`master`.
This is not wired up yet.

## App Identity

| Item           | Value                               | Where                                                   |
| -------------- | ----------------------------------- | ------------------------------------------------------- |
| Application ID | `com.educardmobile`                 | apps/mobile/android/app/build.gradle                    |
| App name       | `@string/app_name`                  | apps/mobile/android/app/src/main/res/values/strings.xml |
| Launcher icon  | `ic_launcher` / `ic_launcher_round` | apps/mobile/android/app/src/main/res/mipmap-\*          |

Dev and production currently share the application ID, so both cannot be installed side by side on
the same device — the newer install replaces the older one. Separating them requires a product
flavor with an `applicationIdSuffix`, not a second keystore.

## Environment Variable Strategy

### Mobile (APK)

- Development APK build writes API_URL from MOBILE_API_URL_DEV into apps/mobile/.env.production.
- App reads it in apps/mobile/src/constants/config.ts via react-native-config.

### Web (Vercel)

- Dev deployment injects VITE_API_BASE_URL from VITE_API_BASE_URL_DEV.
- Prod deployment injects VITE_API_BASE_URL from VITE_API_BASE_URL_PROD.
- Web app reads it via import.meta.env.VITE_API_BASE_URL.

## Validation Checklist

1. Push to develop and confirm the Mobile APK Build workflow starts.
2. Confirm artifact `educard-mobile-dev-release-apk` is generated.
3. Confirm the run summary reports `Signing: release keystore`.
4. Install the APK on a real device and verify API calls hit the dev backend.
5. Reinstall a newer build over the old one to confirm the upgrade works (validates consistent signing).
6. Push to main and verify the Vercel production build uses the prod API URL.

## Troubleshooting

| Symptom                               | Cause                                                    | Fix                                                                            |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| "App not installed" when updating     | Build signed with a different key than the installed app | Ensure the keystore secrets are set; uninstall the old build once to recover   |
| Summary shows debug keystore fallback | `ANDROID_KEYSTORE_BASE64` missing or empty               | Re-add the secret; confirm the base64 is a single line                         |
| Network requests fail on device only  | `MOBILE_API_URL_DEV` points at localhost or a LAN IP     | Use a publicly reachable HTTPS URL                                             |
| Play rejects the upload               | `versionCode` not incremented                            | Raise `versionCode` in app/build.gradle                                        |
| `base64: invalid input` in CI         | Secret contains line breaks                              | Regenerate with `base64 -w 0` (Linux) or `base64 -i ... \| tr -d '\n'` (macOS) |
