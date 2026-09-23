# 🚀 EduCard Mobile - Quick Start Testing (Production Backend)

## ✅ Fixes Applied

1. ✅ **Metro Config Fixed** - No more `exclusionList` error
2. ✅ **Environment Files Updated** - Production backend configured
3. ✅ **Dependencies Fixed** - All build issues resolved

---

## 🎯 START HERE - Test with Production Backend

### Step 1: Start Metro Bundler (Terminal 1)

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
pnpm start
```

**Keep this running!** You'll see:

```
Metro waiting on http://localhost:8081
```

---

### Step 2: Launch App (Terminal 2 - New Terminal)

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile

# Option A: Test with Production Backend (RECOMMENDED)
ENVFILE=.env.production pnpm android

# Option B: Test with Local Backend (if you have it running)
pnpm android
```

**What happens:**

- ✅ Builds the app (~2-3 min first time, <30s after)
- ✅ Installs on your device/emulator
- ✅ Launches automatically
- ✅ Hot reload enabled (edit code = instant update)

---

## 📱 Testing Devices

### Using Android Emulator (Easiest)

1. Open Android Studio
2. **Tools → Device Manager** → Start an emulator
3. Wait for it to fully boot
4. Run: `ENVFILE=.env.production pnpm android`

### Using Physical Phone

1. Enable **USB Debugging** on phone (Settings → About → Tap Build# 7 times → Developer Options → USB Debugging)
2. Connect via USB
3. Run: `adb devices` (should see your device)
4. Run: `ENVFILE=.env.production pnpm android`

---

## 🔧 Backend Connection

### API URL (Configured)

```
Production: https://educard-backend-api-272236662775.asia-south1.run.app/api
```

### ⚠️ Backend CORS Settings Required

Your Django backend needs to allow mobile app requests. Add to **`config/settings/production.py`**:

```python
# CORS for Mobile App
CORS_ALLOWED_ORIGINS = [
    "https://educard-backend-api-272236662775.asia-south1.run.app",
]

# OR for testing (remove in production!)
CORS_ALLOW_ALL_ORIGINS = True

# If using JWT (which you should be for mobile)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

**Note:** Mobile apps use JWT tokens, not cookies, so CSRF is typically not needed.

---

## 🐛 Common Issues & Fixes

### ❌ "exclusionList is not a function"

**Status:** ✅ FIXED! Metro config updated.

### ❌ App can't connect to backend

**Fix:**

1. Check backend CORS settings (see above)
2. Verify API URL: `cat .env.production`
3. Test backend: `curl https://educard-backend-api-272236662775.asia-south1.run.app/api/`
4. Rebuild: `cd android && ./gradlew clean && cd .. && ENVFILE=.env.production pnpm android`

### ❌ Red screen: "Unable to load script"

**Fix:** Metro not running. Start it: `pnpm start`

### ❌ Device not found

**Fix:**

```bash
adb devices  # Should show your device
# If empty: check USB connection or restart adb
adb kill-server && adb start-server
```

---

## 🎨 Development Workflow

### Making Code Changes

1. Edit any `.tsx` or `.ts` file
2. **Save** (Cmd+S)
3. App **auto-reloads** (Fast Refresh)
4. No rebuild needed! 🎉

### When to Rebuild

Only rebuild when you:

- ✅ Change native code (android/)
- ✅ Add new native packages
- ✅ Change .env files
- ✅ First time setup

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile/android
./gradlew clean
cd ..
ENVFILE=.env.production pnpm android
```

### Dev Menu

**Open dev menu:**

- **Emulator:** Cmd+M (Mac) or Ctrl+M (Windows)
- **Physical Device:** Shake the phone

**Menu options:**

- Reload
- Debug JS Remotely
- Show Inspector
- etc.

---

## 📦 Build APK for Distribution

### Debug APK (Quick testing)

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile/android
./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (Production)

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile/android
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release.apk
```

**Install APK:**

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

---

## 📋 Quick Commands Cheat Sheet

```bash
# --- Essential Commands ---

# Start Metro (Terminal 1)
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
pnpm start

# Run app with production backend (Terminal 2)
ENVFILE=.env.production pnpm android

# View logs
npx react-native log-android

# Check devices
adb devices

# --- Troubleshooting ---

# Clean and rebuild
cd android && ./gradlew clean && cd ..
ENVFILE=.env.production pnpm android

# Reset Metro cache
pnpm start --reset-cache

# Reverse ports (physical device)
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000

# --- Build APKs ---

# Debug APK
cd android && ./gradlew assembleDebug

# Release APK
cd android && ./gradlew assembleRelease
```

---

## 🎯 What's Next?

1. ✅ **Start Metro** - Terminal 1: `pnpm start`
2. ✅ **Launch App** - Terminal 2: `ENVFILE=.env.production pnpm android`
3. ⚙️ **Configure Backend** - Update CORS settings (see Backend Connection section)
4. 🧪 **Test Features** - Login, navigation, API calls
5. 🐛 **Debug Issues** - Use troubleshooting section if needed

---

## 📚 Full Documentation

For detailed information, see:

- **Complete Testing Guide:** `/docs/MOBILE_TESTING_COMPLETE_GUIDE.md`
- **Android Setup Guide:** `/docs/MOBILE_ANDROID_LOCAL_TESTING_AND_APK.md`

---

**You're all set! 🎉 Start testing with the production backend.**
