# EduCard Deployment Guide

This guide covers deploying the web app to Vercel and building mobile APKs using Expo.

---

## Table of Contents

1. [Vercel Deployment (Web)](#vercel-deployment-web)
2. [Expo APK Build (Android)](#expo-apk-build-android)
3. [Expo iOS Build](#expo-ios-build)
4. [Environment Setup](#environment-setup)

---

## Vercel Deployment (Web)

### Prerequisites

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

### Deploy Commands

#### Preview Deployment (Non-production)

```bash
cd /path/to/educard-clients

# Deploy to preview (creates a unique URL)
vercel

# Or with specific project
vercel --project educard-clients
```

#### Production Deployment

```bash
# Deploy to production
vercel --prod

# Deploy specific branch to production
vercel --prod --branch develop
```

#### Deploy with Build Override

```bash
# Custom build command
vercel --prod --build-command "pnpm --filter @educard/web build"

# With environment variables
vercel --prod --env VITE_API_URL=https://api.example.com
```

### Useful Vercel CLI Commands

```bash
# List all deployments
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Remove a deployment
vercel rm <deployment-url>

# View project info
vercel inspect <deployment-url>

# Pull environment variables locally
vercel env pull .env.local

# Add environment variable
vercel env add VITE_API_URL

# List environment variables
vercel env ls
```

### Automatic Deployments

Automatic deployments are configured via `vercel.json`:

```json
{
  "git": {
    "deploymentEnabled": {
      "develop": true
    }
  }
}
```

- **develop branch** → Production deployment
- **Other branches** → Preview deployment
- **Pull Requests** → Preview deployment with comments

---

## Expo APK Build (Android)

### Prerequisites

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Verify login
eas whoami
```

### Build Commands

#### Development Build (APK for testing)

```bash
cd apps/mobile

# Build development APK (installs on device for testing)
eas build --platform android --profile development

# Build with local credentials (faster, no cloud build)
eas build --platform android --profile development --local
```

#### Preview Build (APK for internal testing)

```bash
# Build preview APK (for QA/internal testers)
eas build --platform android --profile preview
```

#### Production Build (AAB for Play Store)

```bash
# Build production AAB (Android App Bundle)
eas build --platform android --profile production

# Build production APK instead of AAB
eas build --platform android --profile production-apk
```

### EAS Build Profiles

Profiles are configured in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    },
    "production-apk": {
      "extends": "production",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Useful EAS Commands

```bash
# List all builds
eas build:list

# View build details
eas build:view <build-id>

# Cancel a build
eas build:cancel <build-id>

# Download APK/AAB
eas build:download --platform android --latest

# Check build status
eas build:list --status=in-progress

# View build logs
eas build:view --logs
```

### Local APK Build (Without EAS Cloud)

```bash
# Build APK locally (requires Android SDK)
cd apps/mobile

# Generate native Android project
npx expo prebuild --platform android

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release APK
cd android && ./gradlew assembleRelease

# APK location
# Debug: android/app/build/outputs/apk/debug/app-debug.apk
# Release: android/app/build/outputs/apk/release/app-release.apk
```

---

## Expo iOS Build

### Prerequisites

- Apple Developer Account ($99/year)
- macOS for local builds

### Build Commands

```bash
cd apps/mobile

# Build iOS simulator
eas build --platform ios --profile development-simulator

# Build iOS device (Ad Hoc)
eas build --platform ios --profile preview

# Build for App Store
eas build --platform ios --profile production
```

---

## Environment Setup

### Required Environment Variables

#### Web App (Vercel)

```env
VITE_API_URL=https://your-api-domain.com
VITE_APP_NAME=EduCard
```

#### Mobile App (Expo)

In `app.json` or `app.config.js`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api-domain.com"
    }
  }
}
```

Or use `.env` files with `expo-constants`:

```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com
```

### Configure EAS Project

```bash
# Initialize EAS in project
eas init

# Configure build
eas build:configure

# Set up credentials
eas credentials
```

---

## Quick Reference

### Deploy Web to Production

```bash
cd educard-clients
vercel --prod
```

### Build Android APK

```bash
cd educard-clients/apps/mobile
eas build --platform android --profile preview
```

### Build Both Platforms

```bash
cd educard-clients/apps/mobile
eas build --platform all --profile preview
```

---

## Troubleshooting

### Vercel Build Fails

```bash
# Check build logs
vercel logs <deployment-url>

# Clear cache and rebuild
vercel --force
```

### EAS Build Fails

```bash
# Check build logs
eas build:view --logs

# Clear Expo cache
npx expo start --clear

# Regenerate native projects
npx expo prebuild --clean
```

### Credentials Issues

```bash
# Reset Android credentials
eas credentials --platform android

# Generate new keystore
eas credentials --platform android --reset
```

---

## CI/CD Integration

### GitHub Actions for Vercel

```yaml
# .github/workflows/vercel-deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--prod"
```

### GitHub Actions for EAS

```yaml
# .github/workflows/eas-build.yml
name: Android Build (Deprecated Example)
on:
  push:
    tags: ["v*"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "This EAS example is deprecated. Use .github/workflows/mobile-apk-build.yml for current RN CLI APK CI."
```

---

## Support

For issues or questions:

- Vercel Docs: https://vercel.com/docs
- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
