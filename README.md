# EduCard Clients Monorepo

This monorepo contains all client applications for the EduCard School Management System.

## Structure

```
educard-clients/
├── apps/
│   ├── web/                 # React web application
│   └── mobile/              # Expo mobile app (iOS & Android only)
├── packages/
│   └── shared/              # Shared code (types, API client, utils)
└── package.json             # Root package.json with workspaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- For mobile: Xcode (iOS) or Android Studio (Android)

### Installation

```bash
# Install all dependencies
npm install

# Or install specific workspace
npm install --workspace=apps/web
```

### Development

```bash
# Run web app
npm run dev:web

# Run mobile app
npm run dev:mobile

# Run both
npm run dev:web & npm run dev:mobile
```

### Daily Commands (Quick Reference)

For repeated tasks (start servers, git push flow, lint/typecheck, clean reinstall), use:

- [`DEVELOPER_COMMANDS.md`](./DEVELOPER_COMMANDS.md)

### Production Deployment (Full Runbook)

For end-to-end production releases (GitHub, SonarQube, Vercel, Expo APK/AAB builds):

- [`PRODUCTION_RUNBOOK.md`](./PRODUCTION_RUNBOOK.md)

### Building

```bash
# Build web app
npm run build:web

# Build mobile app
npm run build:mobile:ios
npm run build:mobile:android
```

## Apps

### Web App (`apps/web`)

- React + Vite
- Tailwind CSS
- For desktop/laptop browsers

### Mobile App (`apps/mobile`)

- Expo (React Native)
- iOS and Android only (no web output)
- For smartphones

## Shared Packages

### `packages/shared`

- TypeScript types/interfaces
- API client functions
- Utility functions
- Validation schemas (Zod)

## Backend

The backend API is in a separate repository: `educard-backend-api`
