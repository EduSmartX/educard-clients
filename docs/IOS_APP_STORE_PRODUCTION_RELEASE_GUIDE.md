# iOS Production Release Guide — App Store (EduCard Mobile)

How to ship EduCard to the **App Store** against the **prod backend**, and how that
differs from the dev TestFlight builds in
[`IOS_TESTFLIGHT_DEV_TESTING_GUIDE.md`](IOS_TESTFLIGHT_DEV_TESTING_GUIDE.md).
Do the dev guide's one-time setup (§3) first. This guide builds on it.

---

## 1. Dev vs Prod at a glance

|                                   | **Dev**                                                                                                         | **Prod**                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Git branch                        | `develop`                                                                                                       | `main`                                                                  |
| Backend                           | `https://educard-backend-api-272236662775.asia-south1.run.app/api`                                              | `https://educard-backend-api-prod-257994195992.asia-south1.run.app/api` |
| Env file (`apps/mobile/`)         | `.env.development`                                                                                              | `.env.production`                                                       |
| How it's selected (iOS)           | `ENVFILE=.env.development` on the build                                                                         | Default for Release / Archive (no `ENVFILE`)                            |
| `APP_ENV`                         | `development`                                                                                                   | `production`                                                            |
| Xcode configuration               | Release                                                                                                         | Release                                                                 |
| Distribute as                     | **TestFlight Internal Only** (can never go to the App Store)                                                    | **App Store Connect** (TestFlight first, then Submit for Review)        |
| Who gets it                       | Internal testers (`Dev QA` group)                                                                               | Internal testers on TestFlight, then the public after Apple approves    |
| Apple review                      | None                                                                                                            | App Review (usually 24–48 h)                                            |
| Bundle ID / App Store Connect app | `com.educard.app` (same app)                                                                                    | `com.educard.app` (same app)                                            |
| Firebase project                  | `educard-1163e` (shared)                                                                                        | `educard-1163e` (shared)                                                |
| Push (APNs)                       | Production APNs. Xcode switches `aps-environment` to `production` on export for TestFlight and App Store builds | Production APNs                                                         |
| Android counterpart               | `build-apk` CI job → dev APK (`MOBILE_API_URL_DEV`)                                                             | `build-apk-prod` / AAB CI jobs → prod (`MOBILE_API_URL_PROD`)           |

**One app, two kinds of builds.** Dev and prod builds upload to the **same** App
Store Connect app, `com.educard.app`. Only the backend URL baked in at build time
differs, plus whether the build is marked _Internal Only_. Build numbers are shared,
so every upload, dev or prod, needs a higher number than the last.

### How the env file is picked (both platforms)

| Build                               | iOS                          | Android                      |
| ----------------------------------- | ---------------------------- | ---------------------------- |
| Debug / local                       | `.env`                       | `.env.local`                 |
| Release, no `ENVFILE`               | `.env.production` → **prod** | `.env.production` → **prod** |
| Release, `ENVFILE=.env.development` | `.env.development` → **dev** | `.env.development` → **dev** |

iOS: the `EduCard.xcscheme` build pre-action writes `/tmp/envfile`.
Android: `react-native-config`'s `dotenv.gradle` reads `ENVFILE`, falling back to
`envConfigFiles` in `android/app/build.gradle`.

---

## 2. Environment variables

### 2.1 Local files (`apps/mobile/`, gitignored)

`.env.production` (prod, used by App Store builds):

```dotenv
API_URL=https://educard-backend-api-prod-257994195992.asia-south1.run.app/api
APP_ENV=production
GOOGLE_GEOCODING_API_KEY=<GOOGLE_GEOCODING_API_KEY GitHub secret>
SENTRY_DSN=
POSTHOG_KEY=
POSTHOG_HOST=
```

`.env.development` (dev, used by TestFlight dev builds):

```dotenv
API_URL=https://educard-backend-api-272236662775.asia-south1.run.app/api
APP_ENV=development
GOOGLE_GEOCODING_API_KEY=<GOOGLE_GEOCODING_API_KEY GitHub secret>
SENTRY_DSN=
POSTHOG_KEY=
POSTHOG_HOST=
```

Both are already set up on the main build Mac. `.env.example` lists every file
and URL for new machines.

### 2.2 GitHub secrets (check they match)

| Secret                     | Must equal                                                              |
| -------------------------- | ----------------------------------------------------------------------- |
| `MOBILE_API_URL_DEV`       | `https://educard-backend-api-272236662775.asia-south1.run.app/api`      |
| `MOBILE_API_URL_PROD`      | `https://educard-backend-api-prod-257994195992.asia-south1.run.app/api` |
| `GOOGLE_GEOCODING_API_KEY` | Same key as in the local env files                                      |

The Android CI jobs already use these. A future iOS CI job (§9) will reuse them.

### 2.3 Backend

No backend env changes are needed for iOS. Make sure the prod backend has the
release's backend changes **deployed and migrated before** you submit. The App
Store build talks to prod as soon as testers or reviewers open it.

---

## 3. ⚠️ App Store blockers found in the code (fix before submitting)

| #   | Issue                                                                                                                                                 | Why it matters                                                                                                                                                                   | What to do                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **No in-app account deletion.** The app lets users create an account (`SignupScreen` → organization registration), but has no "Delete account" option | App Store Guideline **5.1.1(v)**: apps that allow account creation must let users **start account deletion inside the app**. This is one of the most common rejection reasons    | Add a _Delete account_ entry in Profile/Settings. It can delete the account directly, or submit a deletion request (backend endpoint plus an email to admins) with a confirmation step. Mention it in the review notes |
| 2   | **iPad is enabled** (`TARGETED_DEVICE_FAMILY = "1,2"`)                                                                                                | iPad screenshots (13") become mandatory, and reviewers may test on iPad, where layouts haven't been tested. Once an app ships with iPad support, **later updates can't drop it** | Decide now. If iPad isn't a goal, set _Target → General → Supported Destinations_ to iPhone only (`TARGETED_DEVICE_FAMILY = 1`) before the first submission                                                            |
| 3   | **Login is required**                                                                                                                                 | Reviewers can't get past the login screen without credentials. Missing demo credentials means an instant rejection                                                               | Create a **demo organization on prod** with sample data and demo logins (admin, teacher, parent/student). Put them in _App Review Information_ (§5.3)                                                                  |
| 4   | Bundling phase still runs **Expo CLI**, which only resolves through pnpm hoisting                                                                     | Archive can break on a clean machine                                                                                                                                             | Run `pnpm install` from the repo root before archiving. Long-term, switch to plain `react-native-xcode.sh`                                                                                                             |

Already compliant: 1024×1024 app icon with no alpha ✅,
`ITSAppUsesNonExemptEncryption=false` ✅, `PrivacyInfo.xcprivacy` ✅, usage strings
for camera, contacts, location, photos and Face ID ✅, privacy policy page live ✅.

---

## 4. One-time App Store listing setup (App Store Connect → EduCard)

### 4.1 App Information

- **Name:** EduCard · **Subtitle:** e.g. _Smart School Management_
- **Primary category:** Education (secondary: Productivity)
- **Content rights:** no third-party content
- **Age rating:** fill in the questionnaire (likely 4+)
- **Privacy Policy URL:** `https://educard.info/privacy-policy`

### 4.2 Pricing and Availability

- Price: **Free**. Choose the countries (India only, or all).

### 4.3 App Privacy (the "nutrition label")

Answer from what the app actually does. Starting point, to verify with the backend team:

| Data type                                                                         | Collected | Linked to user | Purpose           |
| --------------------------------------------------------------------------------- | --------- | -------------- | ----------------- |
| Name, email, phone number                                                         | Yes       | Yes            | App functionality |
| Photos (profile photos uploaded)                                                  | Yes       | Yes            | App functionality |
| Precise or coarse location (only for "Use my location", sent to Google Geocoding) | Yes       | No             | App functionality |
| Contacts (number picked locally, never uploaded)                                  | **No**    | —              | —                 |
| Crash data (Firebase Crashlytics)                                                 | Yes       | No             | App functionality |
| Product interaction (Firebase Analytics)                                          | Yes       | No             | Analytics         |
| Device ID (FCM push token)                                                        | Yes       | Yes            | App functionality |
| Tracking across other companies' apps                                             | **No**    | —              | —                 |

### 4.4 Version page (`1.0`)

- **Screenshots:** iPhone **6.9"** (1320×2868 or 1290×2796) is required. iPad
  **13"** (2064×2752) too if iPad stays enabled (§3 #2). Use the Simulator
  (iPhone 16 Pro Max / iPad Pro 13") on the **prod** demo org: _File → Save Screen_.
- **Description, keywords, promotional text**
- **Support URL:** `https://educard.info/contact` · **Marketing URL:** `https://educard.info`
- **Copyright:** e.g. `2026 <legal entity name>`

---

## 5. Release steps

### 5.1 Prepare `main`

```sh
cd educard-clients
git checkout main && git pull           # develop merged and tested on TestFlight dev builds
pnpm install                            # from the repo root (§3 #4)
cd apps/mobile/ios && bundle exec pod install && cd ..
pnpm typecheck && pnpm test
grep '^API_URL' .env.production         # must be the -prod-257994195992 URL
```

**Version and build number** (_Target EduCard → General → Identity_):

- **Version** (`MARKETING_VERSION`): `1.0` for the first release. Bump for each
  later release (`1.0.1` fixes, `1.1` features).
- **Build** (`CURRENT_PROJECT_VERSION`): higher than **any** previous upload,
  dev builds included. `yyMMddHHmm` (e.g. `2611031200`) always works.
- Commit the version bump on `main` so the release is traceable.

### 5.2 Archive & upload the prod build

**Xcode GUI**

1. Open `ios/EduCard.xcworkspace` normally. Do **not** launch it with `ENVFILE`.
2. _Any iOS Device (arm64)_ → _Product → Archive_.
3. `cat /tmp/envfile` → must print **`.env.production`**.
4. Organizer → **Distribute App** → **App Store Connect** → _Upload_.
   Do not choose "TestFlight Internal Only", or the build can't be submitted.

**Command line.** Create `ios/ExportOptions-AppStore.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>destination</key>
  <string>upload</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>YOUR_TEAM_ID</string>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
```

```sh
cd educard-clients/apps/mobile/ios
unset ENVFILE                              # prod must use the default .env.production
TEAM_ID=YOUR_TEAM_ID
BUILD_NUMBER=$(date +%y%m%d%H%M)

xcodebuild -workspace EduCard.xcworkspace -scheme EduCard -configuration Release \
  -destination 'generic/platform=iOS' -archivePath build/EduCard-prod.xcarchive \
  -allowProvisioningUpdates DEVELOPMENT_TEAM=$TEAM_ID CURRENT_PROJECT_VERSION=$BUILD_NUMBER \
  archive

test "$(cat /tmp/envfile)" = ".env.production" && echo "OK: prod env" || echo "STOP: wrong env file"

xcodebuild -exportArchive -archivePath build/EduCard-prod.xcarchive \
  -exportOptionsPlist ExportOptions-AppStore.plist -exportPath build/export-prod \
  -allowProvisioningUpdates
```

### 5.3 Test the prod build on TestFlight, then submit

1. When the build is **Ready to Test**, add it to the internal `Dev QA` group. Testers
   install it from TestFlight (dev guide §6). Its _What to Test_ note should say
   **PROD backend**.
2. Smoke test **on prod with the demo organization only**. Real schools' data is live:
   - [ ] Login per role (admin, teacher, parent, student) with the demo accounts
   - [ ] Data shown is prod demo-org data, not dev data
   - [ ] Push notification arrives
   - [ ] Camera, contacts and location prompts, and the address form
   - [ ] Account deletion flow (§3 #1)
   - [ ] Signup / organization registration (then delete the test org)
3. _App Store Connect → EduCard → iOS App 1.0 → Build → +_ → select the build.
4. **App Review Information:**
   - _Sign-in required_: ✅. Username and password of the demo **admin** account.
   - _Notes_: what EduCard is (school management for admins, teachers, parents
     and students), the extra demo logins per role, where _Delete account_ is, and
     that "Use my location" only fills in an address.
   - Contact name, phone and email.
5. **Version Release:** choose _Manually release this version_. Optionally turn on
   _Phased Release_ (rolls out over 7 days to automatic updates).
6. **Add for Review → Submit to App Review.**

### 5.4 After approval

- Click **Release This Version** (if manual release).
- Watch **Firebase Crashlytics** and prod backend logs for the first 24–48 h.
- Tag the release: `git tag ios-v1.0-<build>` and `git push --tags`.
- Turn on the App Store badges/links on the web (commit `41bc8d0`) with the real
  App Store URL.

### 5.5 If rejected

Read the message in _App Store Connect → Resolution Center_. Fix it, bump only
the **Build** number (keep the version), upload, select the new build, and reply
or resubmit.

---

## 6. Ongoing flow

```
feature/* ──► develop ──► TestFlight dev build  (ENVFILE=.env.development, Internal Only)
                 │            QA on DEV backend
                 ▼
               main ──────► App Store build      (no ENVFILE → .env.production)
                              TestFlight smoke on PROD → Submit for Review → Release
```

- Dev TestFlight builds can continue for the _next_ version while a prod version
  is in review. Use the next `MARKETING_VERSION` (e.g. `1.1`) for dev builds once
  `1.0` is submitted.
- Hotfix: branch from `main`, bump to `1.0.1`, then repeat §5.

---

## 7. Safety rules

1. **Never** submit a build that was archived with `ENVFILE` set. Always check
   `/tmp/envfile` = `.env.production` (§5.2).
2. Dev builds are always distributed as **TestFlight Internal Only**, so they
   can't be selected for App Store review even by mistake.
3. Don't edit `.env.production` to point at dev "just for a test". Use
   `ENVFILE=.env.development` instead.
4. Testers switching between dev and prod builds on one phone should **log out
   first**. Tokens from one backend are invalid on the other.
5. Keep the prod demo-org credentials up to date in App Store Connect. Expired
   demo logins cause rejections on later updates.

---

## 8. Troubleshooting (prod-specific)

| Symptom                                 | Fix                                                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Prod build shows dev data               | It was archived with `ENVFILE` set. Check `/tmp/envfile`, unset `ENVFILE`, _Clean Build Folder_, re-archive |
| "Build can't be selected" for review    | It was exported as _TestFlight Internal Only_. Re-export as _App Store Connect_                             |
| Rejected under 5.1.1(v)                 | Add in-app account deletion (§3 #1)                                                                         |
| Rejected under 2.1, "unable to sign in" | Demo credentials missing or expired, or prod backend down at review time                                    |
| Rejected for iPad layout issues         | Fix the iPad layouts, or (first release only) switch to iPhone only (§3 #2)                                 |
| Rejected under 5.1.1, purpose string    | Make the `Info.plist` usage strings more specific about why each permission is needed                       |
| Missing compliance prompt               | Shouldn't happen: `ITSAppUsesNonExemptEncryption=false` is set                                              |

---

## 9. (Optional) CI: `build-ipa-prod` job

Same as the dev sketch in the dev guide §9, with these changes:

- trigger on `main`/`master` pushes (like `build-apk-prod`)
- write `apps/mobile/.env.production` from `MOBILE_API_URL_PROD` + `APP_ENV=production`
- don't set `ENVFILE`, and assert `cat /tmp/envfile` = `.env.production`
- export with `ExportOptions-AppStore.plist`

CI should only **upload**. Keep _Submit for Review_ and _Release_ as manual steps in
App Store Connect.
