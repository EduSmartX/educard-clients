# EduCard Mobile App - Production Deployment Guide

## Overview

This document covers the complete deployment process for EduCard mobile application across all three platforms: **Web**, **Android (Google Play)**, and **iOS (App Store)**.

---

## 1. Prerequisites

### Accounts Required

| Platform | Account | URL |
|----------|---------|-----|
| Expo | Expo Developer Account | https://expo.dev |
| Apple | Apple Developer Program ($99/year) | https://developer.apple.com |
| Google | Google Play Developer ($25 one-time) | https://play.google.com/console |
| Web | Vercel/Netlify Account | https://vercel.com |

### Install EAS CLI

```bash
npm install -g eas-cli
eas login
```

---

## 2. Environment Configuration

### Environment Files

```bash
# .env.development (local development)
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SENTRY_DSN=

# .env.staging (staging/preview)
EXPO_PUBLIC_API_URL=https://staging-api.educard.com/api
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx

# .env.production (production)
EXPO_PUBLIC_API_URL=https://api.educard.com/api
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### App Configuration

```typescript
// app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) return 'com.educard.app.dev';
  if (IS_PREVIEW) return 'com.educard.app.preview';
  return 'com.educard.app';
};

const getAppName = () => {
  if (IS_DEV) return 'EduCard (Dev)';
  if (IS_PREVIEW) return 'EduCard (Preview)';
  return 'EduCard';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: 'educard-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'educard',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#3B82F6',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'EduCard uses the camera to scan student ID cards and documents.',
      NSPhotoLibraryUsageDescription: 'EduCard needs access to your photos to upload profile pictures.',
      NSLocationWhenInUseUsageDescription: 'EduCard uses your location for attendance verification.',
      UIBackgroundModes: ['remote-notification'],
    },
    config: {
      usesNonExemptEncryption: false,
    },
    associatedDomains: [
      'applinks:educard.com',
      'webcredentials:educard.com',
    ],
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#3B82F6',
    },
    package: getUniqueIdentifier(),
    versionCode: 1,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
    ],
    googleServicesFile: IS_DEV 
      ? './google-services-dev.json' 
      : './google-services.json',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#3B82F6',
        sounds: ['./assets/sounds/notification.wav'],
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow EduCard to access your camera for scanning documents.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Allow EduCard to use your location for attendance.',
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        organization: 'educard',
        project: 'educard-mobile',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: 'your-project-id-here',
    },
  },
  owner: 'educard',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/your-project-id-here',
  },
});
```

---

## 3. EAS Build Configuration

### eas.json

```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "APP_VARIANT": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "APP_VARIANT": "preview"
      },
      "channel": "preview"
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "APP_VARIANT": "production"
      },
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 4. iOS Deployment

### 4.1 Certificates and Provisioning

```bash
# Let EAS handle certificates (recommended)
eas credentials

# Or manually configure
# 1. Create App ID in Apple Developer Portal
# 2. Create Distribution Certificate
# 3. Create Provisioning Profile

# View current credentials
eas credentials --platform ios
```

### 4.2 Build for App Store

```bash
# Build for production
eas build --platform ios --profile production

# Build with local credentials
eas build --platform ios --profile production --local
```

### 4.3 Submit to App Store

```bash
# Automatic submission
eas submit --platform ios --latest

# Or submit specific build
eas submit --platform ios --id BUILD_ID

# Or use EAS Submit configuration
eas submit --platform ios --profile production
```

### 4.4 App Store Connect Setup

1. **App Information**
   - Name: EduCard
   - Subtitle: Smart School Management
   - Category: Education
   - Age Rating: 4+

2. **Privacy Policy**
   - URL: https://educard.com/privacy

3. **App Review Information**
   - Demo Account Credentials
   - Contact Information
   - Notes for Review

4. **Screenshots Required**
   | Device | Size | Count |
   |--------|------|-------|
   | iPhone 6.7" | 1290 × 2796 | 3-10 |
   | iPhone 6.5" | 1284 × 2778 | 3-10 |
   | iPhone 5.5" | 1242 × 2208 | 3-10 |
   | iPad Pro 12.9" | 2048 × 2732 | 3-10 |

### 4.5 iOS Privacy Manifest

```xml
<!-- ios/EduCard/PrivacyInfo.xcprivacy -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeEmailAddress</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypeName</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <true/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

---

## 5. Android Deployment

### 5.1 Keystore Setup

```bash
# Generate upload keystore (first time only)
# Store this securely - losing it requires contacting Google
keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000

# Configure in eas.json or let EAS manage it
eas credentials --platform android
```

### 5.2 Build for Play Store

```bash
# Build AAB for production
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview
```

### 5.3 Submit to Google Play

```bash
# Setup Google Play Service Account
# 1. Go to Google Play Console > Setup > API access
# 2. Create service account with "Release Manager" role
# 3. Download JSON key file

# Submit to internal testing
eas submit --platform android --latest

# Or submit to production
eas submit --platform android --profile production
```

### 5.4 Google Play Console Setup

1. **Store Listing**
   - Title: EduCard - School Management
   - Short Description: (80 chars max)
   - Full Description: (4000 chars max)

2. **Graphic Assets**
   | Asset | Size | Format |
   |-------|------|--------|
   | Icon | 512 × 512 | PNG |
   | Feature Graphic | 1024 × 500 | PNG/JPG |
   | Phone Screenshots | 320-3840 × 320-3840 | PNG/JPG |
   | Tablet Screenshots | 320-3840 × 320-3840 | PNG/JPG |

3. **Content Rating**
   - Complete IARC questionnaire
   - Typically: Everyone (PEGI 3)

4. **Target Audience**
   - Not designed for children
   - Teachers, Parents, School Staff

5. **Data Safety**
   - Types of data collected
   - Data sharing practices
   - Security practices

---

## 6. Web Deployment

### 6.1 Build for Web

```bash
# Build static web app
npx expo export --platform web

# Output will be in /dist folder
```

### 6.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### 6.3 Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npx expo export --platform web",
  "outputDirectory": "dist",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 6.4 Alternative: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npx expo export --platform web

# Deploy
netlify deploy --prod --dir=dist
```

```toml
# netlify.toml
[build]
  command = "npx expo export --platform web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 7. Over-The-Air (OTA) Updates

### 7.1 Configure EAS Update

```bash
# Initialize EAS Update
eas update:configure

# Create update channel
eas channel:create production
eas channel:create preview
```

### 7.2 Publish Updates

```bash
# Publish to preview channel
eas update --branch preview --message "Bug fixes"

# Publish to production channel
eas update --branch production --message "Version 1.0.1"

# Check update status
eas update:list
```

### 7.3 Handle Updates in App

```typescript
// App.tsx
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    async function checkForUpdates() {
      if (!__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            // Prompt user to restart
            Alert.alert(
              'Update Available',
              'A new version is ready. Restart to apply.',
              [
                { text: 'Later', style: 'cancel' },
                { text: 'Restart', onPress: () => Updates.reloadAsync() },
              ]
            );
          }
        } catch (error) {
          console.error('Error checking for updates:', error);
        }
      }
    }

    checkForUpdates();
  }, []);

  return <AppContent />;
}
```

---

## 8. CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      # Build for preview on push to main
      - name: Build Preview
        if: github.ref == 'refs/heads/main'
        run: eas build --platform all --profile preview --non-interactive
      
      # Build and submit production on tag
      - name: Build Production
        if: startsWith(github.ref, 'refs/tags/v')
        run: |
          eas build --platform all --profile production --non-interactive
          eas submit --platform all --latest

  deploy-web:
    runs-on: ubuntu-latest
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Build Web
        run: npx expo export --platform web
      
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./dist
```

---

## 9. Monitoring & Analytics

### 9.1 Sentry Integration

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.EXPO_PUBLIC_APP_ENV,
  enableInExpoDevelopment: false,
  debug: __DEV__,
  tracesSampleRate: 0.2,
});

export default Sentry.wrap(RootLayout);
```

### 9.2 Analytics (PostHog/Mixpanel)

```typescript
// lib/analytics.ts
import PostHog from 'posthog-react-native';

export const analytics = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_KEY!,
  {
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST,
  }
);

// Usage
analytics.capture('screen_view', { screen: 'Dashboard' });
analytics.identify(userId, { role: userRole });
```

---

## 10. Release Checklist

### Pre-Release

- [ ] All tests passing
- [ ] Performance tested
- [ ] Security review completed
- [ ] Privacy manifest updated
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] Screenshots updated (if UI changed)

### Build & Submit

- [ ] Environment variables set correctly
- [ ] Build succeeds for all platforms
- [ ] App tested on physical devices
- [ ] Submitted to stores

### Post-Release

- [ ] Monitor crash reports (Sentry)
- [ ] Monitor app reviews
- [ ] Check analytics for anomalies
- [ ] Update documentation

---

## 11. Version Management

### Semantic Versioning

```
MAJOR.MINOR.PATCH

1.0.0 - Initial release
1.0.1 - Bug fixes (OTA update possible)
1.1.0 - New features (new build required)
2.0.0 - Breaking changes
```

### Updating Versions

```bash
# Update version in app.json
# Bump automatically with EAS
# eas.json has autoIncrement: true for production

# Manual version bump
# app.json: "version": "1.1.0"
# iOS: "buildNumber": "2"
# Android: "versionCode": 2
```

---

## Quick Reference Commands

```bash
# Development
npx expo start                              # Start dev server

# Building
eas build --platform ios                    # Build iOS
eas build --platform android                # Build Android
eas build --platform all                    # Build both

# Submitting
eas submit --platform ios                   # Submit to App Store
eas submit --platform android               # Submit to Play Store

# OTA Updates
eas update --branch production              # Publish update

# Web
npx expo export --platform web              # Build for web
vercel --prod                               # Deploy to Vercel

# Credentials
eas credentials --platform ios              # Manage iOS certs
eas credentials --platform android          # Manage Android keystore
```
