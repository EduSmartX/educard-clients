# Android Release Guide (APK/AAB + Play Console)

This guide is for the current React Native CLI app in `apps/mobile`.

Current project facts:

- App ID: `com.educardmobile`
- Android config file: `apps/mobile/android/app/build.gradle`
- Environment file used for release: `.env.production`
- Current release build is configured with debug signing (must be changed for production)

## Important Note About Play Store

Google Play expects an **AAB** for new apps and most production updates.

- Use `APK` for local QA, direct install, or quick internal sharing.
- Use `AAB` for Play Console upload.

## 1) Prerequisites

- JDK 17+
- Android SDK + platform tools
- Working Gradle build
- Access to Play Console app entry

## 2) Create a Release Keystore (one-time)

From `apps/mobile/android/app` run:

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore educard-upload-key.keystore \
  -alias educard-upload-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Store this file securely (password manager + secure backup).

## 3) Configure Signing for Release

### 3.1 Put signing secrets in `android/gradle.properties`

Add:

```properties
MYAPP_UPLOAD_STORE_FILE=educard-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=educard-upload-key
MYAPP_UPLOAD_STORE_PASSWORD=your_store_password
MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
```

Place `educard-upload-key.keystore` inside `apps/mobile/android/app/`.

### 3.2 Update `android/app/build.gradle`

Replace release signing config from debug to real release signing.

Use this pattern:

```gradle
android {
  defaultConfig {
    applicationId "com.educardmobile"
    versionCode 2
    versionName "1.0.1"
  }

  signingConfigs {
    debug {
      storeFile file('debug.keystore')
      storePassword 'android'
      keyAlias 'androiddebugkey'
      keyPassword 'android'
    }
    release {
      if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
      }
    }
  }

  buildTypes {
    debug {
      signingConfig signingConfigs.debug
    }
    release {
      signingConfig signingConfigs.release
      minifyEnabled false
      proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
  }
}
```

## 4) Bump App Version Each Release

In `android/app/build.gradle`:

- Increase `versionCode` (must always go up)
- Update `versionName` (human-readable)

## 5) Build Signed Release APK (for QA)

From `apps/mobile/android`:

```bash
ENVFILE=.env.production ./gradlew clean
ENVFILE=.env.production ./gradlew assembleRelease
```

Output APK:

- `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

## 6) Build Signed AAB (for Play Console)

From `apps/mobile/android`:

```bash
ENVFILE=.env.production ./gradlew clean
ENVFILE=.env.production ./gradlew bundleRelease
```

Output AAB:

- `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`

## 7) Quick Validation Before Upload

Install APK locally:

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

Check:

- App opens and login works
- API endpoints point to expected environment
- Push/notifications/attachments critical flows

## 8) Upload to Play Console

1. Open Play Console -> your app
2. Go to **Testing** (Internal/Closed) or **Production**
3. Create/Edit release
4. Upload `app-release.aab`
5. Add release notes
6. Review and roll out

## 9) First-Time Play App Signing Notes

If this is first upload:

- Enable Play App Signing in Play Console
- Keep your upload keystore safe forever
- Future updates must be signed with the same upload key

## 10) Troubleshooting

- "Upload key mismatch": wrong keystore/alias/password
- "Version code already used": increase `versionCode`
- Build uses wrong env: ensure `ENVFILE=.env.production`
- Unsigned/Debug-signed release: verify `release` uses `signingConfigs.release`

## Recommended Release Command Set

From `apps/mobile/android`:

```bash
ENVFILE=.env.production ./gradlew clean
ENVFILE=.env.production ./gradlew bundleRelease
```

Upload the generated `.aab` to Play Console.
