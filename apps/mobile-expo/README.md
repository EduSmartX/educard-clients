# EduCard Mobile

Cross-platform mobile application for EduCard School Management System.

Built with **Expo SDK 52+** | Supports **iOS**, **Android**, and **Web**

## 📱 Features

- **Multi-Role Support**: Admin, Employee (Teacher), and Parent views
- **Offline First**: Works without internet, syncs when connected
- **Push Notifications**: Real-time alerts for attendance, exams, announcements
- **Cross-Platform**: Single codebase for iOS, Android, and Web

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- iOS: Xcode (macOS only)
- Android: Android Studio

### Installation

```bash
# Clone the repository
git clone git@github.com:EduSmartX/educard-mobile.git
cd educard-mobile

# Install dependencies
npm install

# Create environment file
cp .env.example .env.development

# Start development server
npx expo start
```

### Running on Devices

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Web Browser
npx expo start --web

# Physical Device (scan QR code with Expo Go)
npx expo start
```

## 📁 Project Structure

```
educard-mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   │   ├── (admin)/       # Admin role screens
│   │   ├── (employee)/    # Employee role screens
│   │   └── (parent)/      # Parent role screens
│   └── (modals)/          # Modal screens
├── src/
│   ├── api/               # API client and endpoints
│   ├── components/        # Reusable components
│   │   ├── ui/           # Base UI components
│   │   ├── forms/        # Form components
│   │   └── layout/       # Layout components
│   ├── features/          # Feature modules
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   ├── providers/         # Context providers
│   ├── constants/         # App constants
│   ├── types/             # TypeScript types
│   └── utils/             # Helper functions
├── assets/                # Static assets
├── docs/                  # Documentation
│   ├── ARCHITECTURE_DESIGN.md
│   ├── DEVELOPMENT_GUIDELINES.md
│   ├── TESTING_GUIDE.md
│   └── DEPLOYMENT_GUIDE.md
└── __tests__/             # Test files
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# E2E tests (Detox)
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug
```

## 🏗️ Building

```bash
# Development build
npm run build:dev

# Preview build (internal testing)
npm run build:preview

# Production build
npm run build:prod
```

## 📦 Deployment

```bash
# Submit to App Store
npm run submit:ios

# Submit to Play Store
npm run submit:android

# Deploy web to Vercel
npx expo export --platform web
vercel --prod
```

## 📚 Documentation

- [Architecture Design](./docs/ARCHITECTURE_DESIGN.md)
- [Development Guidelines](./docs/DEVELOPMENT_GUIDELINES.md)
- [Testing Guide](./docs/TESTING_GUIDE.md)
- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)

## 🔧 Scripts

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `npm start`         | Start Expo development server  |
| `npm run ios`       | Run on iOS device/simulator    |
| `npm run android`   | Run on Android device/emulator |
| `npm run web`       | Run in web browser             |
| `npm test`          | Run unit tests                 |
| `npm run lint`      | Run ESLint                     |
| `npm run typecheck` | Run TypeScript check           |
| `npm run format`    | Format code with Prettier      |

## 🌐 Environment Variables

Create `.env.development`, `.env.staging`, and `.env.production` files:

```env
EXPO_PUBLIC_API_URL=https://api.educard.com
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

## 📄 License

Private - EduSmartX © 2024
