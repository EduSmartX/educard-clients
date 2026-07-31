# EduCard Mobile - Complete Testing Guide

**Last Updated:** July 31, 2026  
**Target:** EduCard Production Backend on GCP Cloud Run

---

## 🎯 Quick Start - Test with Production Backend

Since you don't have the backend running locally, we'll test against the production backend.

### Step 1: Start Metro Bundler

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
pnpm start
```

Keep this terminal running. Metro will bundle your JavaScript code.

### Step 2: Build & Run with Production Backend

**In a NEW terminal:**

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile

# Build debug APK with production backend
ENVFILE=.env.production pnpm android
```

This will:

- ✅ Build the app with production API URL: `https://educard-backend-api-272236662775.asia-south1.run.app/api`
- ✅ Install on your emulator/device
- ✅ Launch the app automatically

---

## 📱 Testing Options

### Option 1: Android Emulator (Recommended for Development)

**Pros:**

- Fast iteration
- Easy debugging
- No cable needed

**Setup:**

1. Open Android Studio
2. Go to: **Tools → Device Manager**
3. Create or start a virtual device (e.g., Pixel 8 with Android 14)
4. Wait for emulator to fully boot
5. Run: `pnpm android` from mobile directory

### Option 2: Physical Android Phone

**Pros:**

- Real device testing
- Better performance
- Test camera, sensors, etc.

**Setup:**

1. **Enable Developer Options** on your phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → System → Developer Options

2. **Enable USB Debugging**:
   - In Developer Options, enable "USB Debugging"

3. **Connect via USB**:

   ```bash
   # Verify device is connected
   adb devices

   # Should show:
   # List of devices attached
   # XXXXXXXXXX    device
   ```

4. **Run the app**:
   ```bash
   cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
   pnpm android
   ```

### Option 3: Wireless Debugging (Physical Phone, No Cable)

**Android 11+:**

1. **On Phone:**
   - Settings → Developer Options → Wireless Debugging → ON
   - Tap "Pair device with pairing code"
   - Note the IP address and port (e.g., `192.168.31.100:37573`)

2. **On Mac:**
   ```bash
   # Pair first time
   adb pair 192.168.31.100:37573
   # Enter the pairing code shown on phone

   # Connect
   adb connect 192.168.31.100:5555

   # Verify
   adb devices

   # Now run the app
   cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
   pnpm android
   ```

---

## 🔧 Backend Configuration

### Current Setup

Your app is configured to connect to:

```
Production: https://educard-backend-api-272236662775.asia-south1.run.app/api
```

### Backend CORS/CSRF Configuration Needed

The Django backend needs to allow requests from your mobile app. Update these settings:

**File:** `educard-backend-api/config/settings/production.py`

```python
# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "https://educard-backend-api-272236662775.asia-south1.run.app",
    # Add any other frontend origins
]

# For mobile apps, you may need to allow all origins during development
# CORS_ALLOW_ALL_ORIGINS = True  # Only for testing!

# CSRF Configuration
CSRF_TRUSTED_ORIGINS = [
    "https://educard-backend-api-272236662775.asia-south1.run.app",
]

# Mobile apps don't send cookies, so CSRF might not be needed
# But if you're using session auth, configure it properly
```

**For Mobile App Specifically:**

Since mobile apps don't use cookies/sessions by default, you're likely using **JWT tokens**. In that case:

```python
# In production.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    # ... other settings
}

# CORS for mobile - allow credentials
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "https://educard-backend-api-272236662775.asia-south1.run.app",
]

# Or during testing, allow all (NOT for production!)
# CORS_ALLOW_ALL_ORIGINS = True
```

---

## 🧪 Testing Workflow

### 1. First Launch

```bash
# Terminal 1: Start Metro
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
pnpm start

# Terminal 2: Run on device/emulator with production backend
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
ENVFILE=.env.production pnpm android
```

### 2. Making Code Changes

After Metro is running and app is installed:

1. Edit your React Native code (`.tsx`, `.ts` files)
2. Save the file
3. The app will **hot reload automatically** (no rebuild needed!)
4. Shake device or press `Cmd+M` (emulator) / `Cmd+D` (simulator) to open dev menu

### 3. Rebuild When Needed

Rebuild only when you:

- Change native code (Java/Kotlin/Android)
- Add new native dependencies
- Change `.env` files
- Change `android/` configuration

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
pnpm android
```

---

## 🐛 Troubleshooting

### Metro Error: "exclusionList is not a function"

**Fixed!** The `metro.config.js` has been updated to properly import `exclusionList`.

### App Can't Connect to Backend

1. **Check API URL** in `.env.production`:

   ```bash
   cat /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile/.env.production
   ```

   Should show: `API_URL=https://educard-backend-api-272236662775.asia-south1.run.app/api`

2. **Verify backend is accessible**:

   ```bash
   curl https://educard-backend-api-272236662775.asia-south1.run.app/api/
   ```

3. **Check CORS settings** on backend (see Backend Configuration section above)

4. **Rebuild after changing `.env`**:
   ```bash
   cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile/android
   ./gradlew clean
   cd ..
   ENVFILE=.env.production pnpm android
   ```

### Red Screen: "Unable to load script"

**Solution:** Metro bundler not running or not reachable.

```bash
# Terminal 1: Start Metro
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
pnpm start --reset-cache

# Terminal 2: For physical device, reverse port
adb reverse tcp:8081 tcp:8081
```

### Device Not Detected

```bash
# Check device connection
adb devices

# If empty, troubleshoot USB/wireless connection
# For emulator: Make sure it's fully booted before running app
```

---

## 📦 Building APK for Distribution

### Debug APK (for internal testing)

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile/android

# Build debug APK with production backend
./gradlew assembleDebug

# Output:
# apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (for production)

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile/android

# Build release APK (automatically uses .env.production)
./gradlew assembleRelease

# Output:
# apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

**Install APK on device:**

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

---

## 🎨 Development Tips

### Live Reload Features

1. **Fast Refresh** (automatic):
   - Save a file
   - App updates instantly
   - Component state preserved

2. **Dev Menu**:
   - **Emulator:** Press `Cmd+M` (Mac) or `Ctrl+M` (Windows/Linux)
   - **Physical Device:** Shake the device
   - Options: Reload, Debug, Show Inspector, etc.

3. **Debug Console**:
   ```bash
   # View all logs
   adb logcat *:S ReactNative:V ReactNativeJS:V

   # Or use React Native CLI
   npx react-native log-android
   ```

### Network Debugging

1. **React Native Debugger** (recommended):

   ```bash
   brew install --cask react-native-debugger
   # Then enable Debug JS Remotely from dev menu
   ```

2. **Flipper** (advanced):
   ```bash
   brew install --cask flipper
   # Network inspector, Redux devtools, etc.
   ```

---

## 📋 Complete Testing Checklist

### Before Testing

- [ ] Android emulator or physical device ready
- [ ] Metro bundler started (`pnpm start`)
- [ ] `.env.production` configured with correct API_URL
- [ ] Backend CORS settings allow mobile requests
- [ ] adb can see device (`adb devices`)

### During Testing

- [ ] App launches without crashes
- [ ] Can reach login screen
- [ ] API calls work (check Network tab or logs)
- [ ] Authentication flows work
- [ ] Navigation works between screens
- [ ] Images/assets load correctly

### Performance Checks

- [ ] App loads in < 3 seconds
- [ ] Smooth scrolling (60 FPS)
- [ ] No memory leaks
- [ ] API responses < 1 second

---

## 🚀 Quick Commands Reference

```bash
# Start Metro bundler
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
pnpm start

# Run on device/emulator (production backend)
ENVFILE=.env.production pnpm android

# Run with local backend (if you have it running)
pnpm android

# View logs
npx react-native log-android

# Clear cache and restart
pnpm start --reset-cache

# Build release APK
cd android && ./gradlew assembleRelease

# Check connected devices
adb devices

# Reverse port for physical device
adb reverse tcp:8081 tcp:8081
adb reverse tcp:8000 tcp:8000
```

---

## 🎯 Next Steps

1. ✅ **Metro config fixed** - No more `exclusionList` error
2. ✅ **Env files updated** - Production backend URL configured
3. 🔄 **Test the app** - Follow "Quick Start" section above
4. ⚙️ **Configure backend** - Update CORS/CSRF settings (see Backend Configuration)
5. 📱 **Choose testing method** - Emulator or physical device
6. 🐛 **Debug if needed** - Use troubleshooting section

**Ready to test!** Start Metro bundler, then run the app with the commands above.
