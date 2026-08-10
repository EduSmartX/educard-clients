# Mobile APK CI/CD Setup

This setup creates an Android APK automatically on each development push, so testers can install and validate quickly.

## What Is Configured

- Workflow file: .github/workflows/mobile-apk-build.yml
- Trigger branches: develop, development
- Build system: React Native CLI + Gradle
- Build behavior: non-blocking checks (lint/typecheck can fail, build still runs)
- Output: downloadable APK artifact in GitHub Actions

## Build Flow

1. Push code to develop or development.
2. GitHub Actions runs optional mobile checks.
3. Workflow generates apps/mobile/.env.production from secret values.
4. Gradle builds Android release APK from apps/mobile/android.
5. Workflow uploads APK as artifact.
6. Testers can download APK from workflow run.

## Required GitHub Secrets

Add these repository secrets:

1. MOBILE_API_URL_DEV
2. VERCEL_TOKEN
3. VERCEL_ORG_ID
4. VERCEL_PROJECT_ID_DEV
5. VERCEL_PROJECT_ID_PROD
6. VITE_API_BASE_URL_DEV
7. VITE_API_BASE_URL_PROD

## Secret Purpose

- MOBILE_API_URL_DEV: backend API URL used in development APK build.
- VITE_API_BASE_URL_DEV: backend API URL used for Vercel dev build.
- VITE_API_BASE_URL_PROD: backend API URL used for Vercel prod build.

## How Testers Get the APK

From GitHub:

1. Open Actions tab.
2. Open the Mobile APK Build workflow run.
3. Download artifact named educard-mobile-dev-release-apk.
4. Share that APK file with testers.

## Play Store Later (Production)

For Play Store release, build Android App Bundle (AAB) from production profile:

- cd apps/mobile/android
- ./gradlew bundleRelease

The AAB is generated under apps/mobile/android/app/build/outputs/bundle/release/.

## Environment Variable Strategy

### Mobile (APK)

- Development APK build writes API_URL from MOBILE_API_URL_DEV into apps/mobile/.env.production.
- App reads it in apps/mobile/src/constants/config.ts via react-native-config.

### Web (Vercel)

- Dev deployment injects VITE_API_BASE_URL from VITE_API_BASE_URL_DEV.
- Prod deployment injects VITE_API_BASE_URL from VITE_API_BASE_URL_PROD.
- Web app reads it via import.meta.env.VITE_API_BASE_URL.

## Validation Checklist

1. Push to develop and confirm Mobile APK Build workflow starts.
2. Confirm artifact educard-mobile-dev-release-apk is generated.
3. Install APK on tester device and verify API calls hit dev backend.
4. Push to main and verify Vercel production build uses prod API URL.
