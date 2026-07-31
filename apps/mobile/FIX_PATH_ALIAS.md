# 🚨 IMMEDIATE FIX: Path Alias Resolution Error

## Error You're Seeing

```
Unable to resolve module @/lib/query-client from /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile/App.tsx
```

## Root Cause

The `@/` TypeScript path alias (defined in `tsconfig.json`) is not configured for Metro bundler. Metro uses Babel to resolve modules, and Babel doesn't know about TypeScript path mappings by default.

## Solution (3 Steps)

### Step 1: Install babel-plugin-module-resolver

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
pnpm add -D babel-plugin-module-resolver
```

### Step 2: Babel config is already updated ✅

Your `babel.config.js` has been updated with the module-resolver configuration:

```javascript
module.exports = {
  presets: [
    ['@react-native/babel-preset', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
  plugins: [
    'react-native-worklets/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
```

### Step 3: Reset Metro cache and restart

**In Terminal 1 (where Metro is running):**

- Press `Ctrl+C` to stop Metro
- Run: `pnpm start --reset-cache`

**In Terminal 2:**

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile

# Option A: Install without rebuilding (faster)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Option B: Full rebuild (if Option A doesn't work)
ENVFILE=.env.production pnpm android
```

**On the emulator:**

- Press "RELOAD (R, R)" button on the red error screen
- Or shake device (Cmd+M) → "Reload"

## Why This Happens

1. **TypeScript** knows about `@/` → `src/*` mapping (from `tsconfig.json`)
2. **Metro bundler** uses **Babel** to transform code, not TypeScript compiler
3. **Babel** needs explicit configuration via `babel-plugin-module-resolver`

## Verification

After the fix, Metro should successfully resolve imports like:

```typescript
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/Button';
```

## Quick Commands

```bash
# Stop Metro (Ctrl+C in Metro terminal)

# Reset and restart Metro
pnpm start --reset-cache

# Reload app on device (press R twice on error screen, or):
adb shell input text "RR"
```

---

**Status:** babel.config.js updated ✅ | Package needs to be installed ⏳
