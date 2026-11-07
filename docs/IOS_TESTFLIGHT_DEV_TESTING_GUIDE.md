# iOS Dev Testing Guide — TestFlight (EduCard Mobile)

How to test `develop` branch changes on iPhones against the **dev backend**, the iOS
equivalent of the dev APK that CI builds for Android (`build-apk` job in
`.github/workflows/ci.yml`).

|                     | Android (today)                                    | iOS (this guide)                               |
| ------------------- | -------------------------------------------------- | ---------------------------------------------- |
| Tester artifact     | `educard-mobile-dev-release.apk` from CI artifacts | TestFlight build                               |
| How testers install | Download APK, sideload                             | TestFlight app → Install                       |
| Built by            | GitHub Actions (`build-apk`)                       | Local Mac with Xcode (CI job optional, see §9) |
| Backend             | `MOBILE_API_URL_DEV` secret → `.env.production`    | `.env.development` → selected via `ENVFILE`    |
| Who can install     | Anyone with the file                               | Testers you invite in App Store Connect        |

> iOS has no "APK". You can't hand testers an installable file unless you
> register every device's UDID (Ad Hoc). **TestFlight Internal Testing** is the
> standard route: no Apple review, builds are ready a few minutes after upload,
> up to 100 internal testers, and each build lasts 90 days.

---

## 1. How the iOS build picks its env file today

The mobile app is **React Native CLI** with `react-native-config`. EAS/Expo
(`eas.json`, `app.json`) is **not** used for iOS builds.

- `ios/EduCard.xcodeproj/xcshareddata/xcschemes/EduCard.xcscheme` has a build
  pre-action, _"Select react-native-config env file"_, that writes `/tmp/envfile`:
  - `ENVFILE` set (e.g. `ENVFILE=.env.development`) → that file
  - otherwise `Release` (Archive / App Store) → `.env.production`
  - otherwise `Debug` (simulator / `pnpm ios`) → `.env`
- `react-native-config` reads `/tmp/envfile` **first**, which is why the pre-action
  has to pass `ENVFILE` through.

| Env  | Backend                                                                 | File               | Used by                                            |
| ---- | ----------------------------------------------------------------------- | ------------------ | -------------------------------------------------- |
| Dev  | `https://educard-backend-api-272236662775.asia-south1.run.app/api`      | `.env.development` | TestFlight dev builds (`ENVFILE=.env.development`) |
| Prod | `https://educard-backend-api-prod-257994195992.asia-south1.run.app/api` | `.env.production`  | App Store releases (default for Release/Archive)   |

Production release steps: [`IOS_APP_STORE_PRODUCTION_RELEASE_GUIDE.md`](IOS_APP_STORE_PRODUCTION_RELEASE_GUIDE.md).

### Problems found in the setup

| #   | Issue                                                                                                                                                                                                        | Impact                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | ✅ **Fixed.** Every Archive used `.env.production`, with no way to pick the dev backend                                                                                                                      | The scheme pre-action now honours `ENVFILE`                                                                   |
| 2   | ✅ **Fixed.** The local `.env.production` pointed at the **dev** Cloud Run service                                                                                                                           | `.env.production` now points at prod. Dev moved to `.env.development`                                         |
| 3   | `.env` (used by iOS Debug) only has the old `EXPO_PUBLIC_*` keys and no `API_URL`                                                                                                                            | Simulator Debug builds quietly fall back to `http://localhost:8000/api` (`src/constants/config.ts`)           |
| 4   | `DEVELOPMENT_TEAM` isn't set in `project.pbxproj`                                                                                                                                                            | You must select the team in Xcode, or pass it to `xcodebuild`                                                 |
| 5   | `CURRENT_PROJECT_VERSION = 1` is fixed                                                                                                                                                                       | A second upload with the same build number is rejected, so bump it every upload (see §5)                      |
| 6   | The "Bundle React Native code and images" phase still runs **Expo CLI** (`expo/scripts/resolveAppEntry`, `export:embed`). `expo` isn't in `apps/mobile/package.json` and only resolves through pnpm hoisting | Release/Archive works locally today. If it ever fails with `Cannot find module 'expo/...'`, this is the cause |

---

## 2. Environment variables

### 2.1 `apps/mobile/.env.development` (local only, gitignored)

✅ Already created on the main dev Mac. On any other Mac, create it with the same
values the Android `build-apk` CI job writes:

```dotenv
# EduCard Dev Backend (GCP Cloud Run)
API_URL=https://educard-backend-api-272236662775.asia-south1.run.app/api
APP_ENV=development
GOOGLE_GEOCODING_API_KEY=<same key as the GOOGLE_GEOCODING_API_KEY GitHub secret>
SENTRY_DSN=
POSTHOG_KEY=
POSTHOG_HOST=
```

`API_URL` must end with `/api` and must be **https**. `Info.plist` sets
`NSAllowsArbitraryLoads=false`, so plain `http://` only works for localhost or LAN.

### 2.2 Code changes (✅ applied a and b; commit them with this merge)

**a) Let `ENVFILE` override the scheme pre-action.** It's in `EduCard.xcscheme`.
To view it in Xcode: _Product → Scheme → Edit Scheme… → Build → Pre-actions →
"Select react-native-config env file"_. The script:

```sh
# ENVFILE overrides the default (e.g. ENVFILE=.env.development for dev TestFlight builds).
# Otherwise Release/Archive uses .env.production (App Store API); Debug uses .env.
# react-native-config reads /tmp/envfile, so it must be rewritten on every build.
if [ -n "${ENVFILE}" ]; then
  echo "${ENVFILE}" > /tmp/envfile
elif [ "${CONFIGURATION}" = "Release" ]; then
  echo ".env.production" > /tmp/envfile
else
  echo ".env" > /tmp/envfile
fi
```

Keep _"Provide build settings from: EduCard"_ selected.

**b) Ignore the new env file.** `apps/mobile/.gitignore` now ignores
`.env.development` (it holds the Geocoding key), alongside `.env`, `.env.local`
and `.env.production`.

**c) Optional:** give `.env` an `API_URL` (or delete it and point Debug at
`.env.local`) so simulator Debug builds stop falling back to localhost.

### 2.3 Other env / secret files that must exist on the build Mac

| File                       | Where                      | Notes                                                                                                                                                       |
| -------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GoogleService-Info.plist` | `apps/mobile/ios/EduCard/` | Gitignored. Must have `BUNDLE_ID = com.educard.app` (the current file does, Firebase project `educard-1163e`). Dev and prod share this one Firebase project |
| `.env.development`         | `apps/mobile/`             | §2.1                                                                                                                                                        |
| `.env.production`          | `apps/mobile/`             | Prod backend. Only used for real App Store builds                                                                                                           |
| `ios/.xcode.env.local`     | `apps/mobile/ios/`         | Optional. Set `NODE_BINARY` if Xcode can't find node (nvm/fnm users)                                                                                        |

### 2.4 Backend

No backend env changes are needed for iOS. Native apps don't use CORS, and push
goes through the same Firebase project. Do check that the dev backend for this
merge is deployed and reachable:

```sh
curl -s -o /dev/null -w "%{http_code}\n" "<API_URL from .env.development>/"
```

### 2.5 Google Geocoding key ("Use my location")

`src/lib/location.ts` calls the Geocoding REST API with plain `fetch`, which sends
no app-identifying headers. If the key is restricted by **application**
(Android/iOS app), requests fail with `REQUEST_DENIED`. Restrict it by **API**
(Geocoding API only) instead. If the key is empty, the button is hidden (by design).

---

## 3. One-time setup

### 3.1 Apple Developer / App Store Connect (account holder or admin)

1. **Apple Developer Program** membership for the organization ($99/yr).
2. **App ID** `com.educard.app` with the **Push Notifications** capability.
   Xcode automatic signing creates and updates it on first archive.
3. **App record** in [App Store Connect](https://appstoreconnect.apple.com) →
   _Apps → + → New App_:
   Platform iOS, Name `EduCard`, Bundle ID `com.educard.app`, SKU e.g. `educard-ios`.
   Skip this if the app already exists.
4. **Internal testers**:
   - _Users and Access_ → invite each tester (any role, e.g. _Developer_ or
     _Customer Support_). They must accept the email invite.
   - _Apps → EduCard → TestFlight → Internal Testing → +_ → create group
     **`Dev QA`** → add the testers → turn on **Automatic Distribution** so each new
     build reaches them.
5. **Push notifications (Firebase)**: _Certificates, IDs & Profiles → Keys → +_ →
   enable **Apple Push Notifications service (APNs)** → download the `.p8`. Then
   in _Firebase Console → educard-1163e → Project settings → Cloud Messaging →
   Apple app configuration_, upload the `.p8` with its Key ID and Team ID. Without
   this, push notifications won't arrive on TestFlight builds.

### 3.2 Build Mac

```sh
xcode-select -p            # Xcode 16.x (16.4 tested)
node -v                    # >= 20
cd educard-clients
pnpm install

cd apps/mobile/ios
bundle install             # Ruby gems from apps/mobile/Gemfile
bundle exec pod install    # re-run after any native dependency change
```

In Xcode, go to _Settings → Accounts_ and add the Apple ID that belongs to the team.

---

## 4. Pre-flight (5 min, catches most failures before archiving)

```sh
cd educard-clients
git checkout develop && git pull
pnpm install
cd apps/mobile/ios && bundle exec pod install && cd ..

pnpm typecheck && pnpm test

# Release build on the simulator against dev. Exercises JS bundling and the env file.
ENVFILE=.env.development pnpm ios --mode Release
cat /tmp/envfile           # must print .env.development
```

Log in once on the simulator to confirm the app talks to the dev backend.

---

## 5. Build & upload to TestFlight

Bump the **build number** every upload. If the `MARKETING_VERSION` (currently
`1.0`) is already **released** on the App Store, bump that too (e.g. `1.0.1`).

### Option A — Xcode GUI

1. Quit Xcode completely, then launch it from the terminal with the override so
   the pre-action can see it:
   ```sh
   cd educard-clients/apps/mobile
   ENVFILE=.env.development /Applications/Xcode.app/Contents/MacOS/Xcode ios/EduCard.xcworkspace &
   ```
   (Always open **`EduCard.xcworkspace`**, not the `.xcodeproj`. Ignore the
   leftover `EducardMobile.xcodeproj`.)
2. Select target **EduCard** → _Signing & Capabilities_ → tick _Automatically
   manage signing_ → pick the **Team**.
3. _General → Identity_: set **Build** to a higher number than the last upload
   (e.g. `2`, `3`, … or `2611021530` = yyMMddHHmm).
4. Device selector → **Any iOS Device (arm64)**.
5. _Product → Archive_. When it finishes, run `cat /tmp/envfile` → should print
   `.env.development`.
6. Organizer → select the archive → **Distribute App** → **TestFlight Internal
   Only** → Distribute.
   _"Internal Only" builds can never be submitted to the App Store, which keeps a
   dev-backend build from reaching real users._
7. Don't commit the build-number change in `project.pbxproj` unless the team wants it.

### Option B — Command line (repeatable, same steps CI would run)

Create `apps/mobile/ios/ExportOptions-TestFlightInternal.plist` (safe to commit,
no secrets):

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
  <key>testFlightInternalTestingOnly</key>
  <true/>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
```

Then:

```sh
cd educard-clients/apps/mobile/ios
TEAM_ID=YOUR_TEAM_ID                 # developer.apple.com → Membership
BUILD_NUMBER=$(date +%y%m%d%H%M)     # always increasing

ENVFILE=.env.development xcodebuild \
  -workspace EduCard.xcworkspace \
  -scheme EduCard \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/EduCard-dev.xcarchive \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=$TEAM_ID \
  CURRENT_PROJECT_VERSION=$BUILD_NUMBER \
  archive

cat /tmp/envfile                     # must print .env.development

xcodebuild -exportArchive \
  -archivePath build/EduCard-dev.xcarchive \
  -exportOptionsPlist ExportOptions-TestFlightInternal.plist \
  -exportPath build/export \
  -allowProvisioningUpdates
```

The export step uploads straight to App Store Connect, using the Apple ID from
_Xcode → Settings → Accounts_. Without an Apple ID login (e.g. in CI), add:
`-authenticationKeyPath AuthKey_XXXX.p8 -authenticationKeyID XXXX -authenticationKeyIssuerID <issuer-uuid>`.

### After upload

- _App Store Connect → EduCard → TestFlight_: the build shows **Processing**, then
  **Ready to Test**, usually after 5–30 min.
- Export compliance doesn't come up: `ITSAppUsesNonExemptEncryption=false` is
  already in `Info.plist`.
- Add **What to Test** notes (branch, commit SHA, backend). Testers see them.

---

## 6. Install on tester iPhones

### 6.1 Where to get TestFlight

TestFlight is Apple's free app for installing test builds. Install it on each
tester's iPhone or iPad:

- **App Store link:** https://apps.apple.com/app/testflight/id899247664
- Or open the **App Store** on the iPhone, search **"TestFlight"** (publisher:
  Apple) and install it.

> **There is no build file to download.** On Android, testers download
> `educard-mobile-dev-release.apk` from the GitHub Actions artifacts and sideload it.
> On iOS, the build goes from Xcode to App Store Connect (§5), and testers install
> it **inside the TestFlight app**. There is no `.ipa` link to share.

### 6.2 Install the EduCard build

1. Tester installs **TestFlight** (§6.1). The device must run iOS 15.1+ (the app's minimum).
2. Opens the invite email → **Accept / View in TestFlight**. Or opens TestFlight and
   signs in with the **same Apple ID** the App Store Connect invite was sent to.
   With a different Apple ID, the build won't appear.
3. **EduCard → Install**. Later builds appear in TestFlight automatically when
   Automatic Distribution is on. They also install automatically if the tester
   turns on _Automatic Updates_ for EduCard in TestFlight.
4. To tell builds apart: _TestFlight → EduCard_ shows version and build number.
   Write down the build number in bug reports.

### 6.3 Who does what

| Step                                                   | Who                     | Where                                                                       |
| ------------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------- |
| Archive & upload the build                             | Developer               | Xcode / `xcodebuild` (§5)                                                   |
| Add the tester to the `Dev QA` group                   | App Store Connect admin | _App Store Connect → EduCard → TestFlight → Internal Testing_ (§3.1 step 4) |
| Install TestFlight, accept the invite, install EduCard | Tester                  | iPhone (§6.1, §6.2)                                                         |

> **Need a shareable file like an APK?** The only way is an **Ad Hoc** build. Each
> tester's iPhone must first be registered by its device ID (UDID) in the Apple
> Developer portal, up to 100 iPhones per year. For dev testing, TestFlight is the
> simpler route.

Installing a TestFlight build replaces any App Store copy of EduCard on that
phone, and the reverse. App data (Keychain tokens) can carry over, so **log out
and back in** when switching between dev and prod builds.

---

## 7. Faster loops without TestFlight

| Need                          | Command                                                                     | Account needed                      |
| ----------------------------- | --------------------------------------------------------------------------- | ----------------------------------- |
| Simulator, live reload        | `ENVFILE=.env.development pnpm ios` (needs the §2.2a change)                | None                                |
| Simulator, release-like       | `ENVFILE=.env.development pnpm ios --mode Release`                          | None                                |
| Your own iPhone via cable     | Xcode → pick the device → Run (scheme `EduCard`)                            | Free Apple ID works (7-day signing) |
| Your own iPhone, release-like | `ENVFILE=.env.development pnpm ios --mode Release --device "<iPhone name>"` | Team account                        |

Push notifications don't work on the simulator. Test push on a real device.

---

## 8. Test checklist for this merge

Changes from `3d791dc` (iOS parity), `41bc8d0` (usernames) and `bdbc58f`. Run it on
**a TestFlight build on a real iPhone**, as a fresh install (delete the app first).

**Install & startup**

- [ ] App launches, splash → login, no crash. Firebase is configured in `AppDelegate`
- [ ] Login works against the **dev** backend (data matches dev, not prod)
- [ ] First launch asks for **Camera**, **Contacts**, then **Notifications**, once each
- [ ] Relaunch: no prompts again
- [ ] **No** location or photo-library prompt at startup (both are asked in context)

**Permissions in context**

- [ ] Profile photo → _Take Photo_ → camera opens
- [ ] Deny camera in iOS Settings → _Take Photo_ → "Camera Access Needed" alert → **Open Settings** opens EduCard's settings
- [ ] _Choose from Library_ works without a photos permission prompt (PHPicker)
- [ ] Address form → **Use my location** → "While Using the App" prompt → address fields fill in
- [ ] Deny location → the feature fails gracefully, no crash
- [ ] Phone field → pick from contacts → number fills in

**UI (Fabric/gradient fix)**

- [ ] Gradient headers and cards aren't clipped, on admin, employee/teacher and student dashboards
- [ ] Manage screen and dashboard Quick Access tiles show with **no** entry animation
- [ ] Forms: keyboard doesn't cover inputs; light single-column layout

**Unified address form** (org registration/edit, student create/edit, teacher create/edit, profile)

- [ ] Order: Country → State → City/District → Street → Address Line 2 → PIN
- [ ] India: State and City use pickers. Other country: free-text fields
- [ ] Save student → backend record has `zip_code` and `address_line_2` (check dev admin/API)
- [ ] Save teacher → same as above
- [ ] Edit an **old** record with legacy address values → values still show and save

**Photos**

- [ ] Upload a large photo (e.g. a 12 MP camera shot) → upload succeeds, stored image ≤ 1024px

**Usernames**

- [ ] Student / Teacher detail screens and Profile show the **username**

**Push notifications** (needs the APNs key from §3.1 step 5)

- [ ] Trigger a notification from the dev backend → it arrives with the app in the background and in the foreground
- [ ] Tapping it opens the app

**Regression smoke** (per role: admin, teacher, parent, student)

- [ ] Attendance, marks, leave balance, timetable, fee, homework screens load
- [ ] Logout → login as another role works

---

## 9. (Optional) Automate it in CI — `build-ipa-dev` job

Mirrors `build-apk`. It needs a **macOS runner**, which bills about 10× Linux
minutes on GitHub-hosted runners. Add these **GitHub secrets**:

| Secret                                 | What                                                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `MOBILE_API_URL_DEV`                   | _(already exists)_ dev API URL                                                                                 |
| `GOOGLE_GEOCODING_API_KEY`             | _(already exists)_                                                                                             |
| `IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64` | `base64 -i ios/EduCard/GoogleService-Info.plist`                                                               |
| `APPLE_TEAM_ID`                        | 10-char Team ID                                                                                                |
| `ASC_API_KEY_ID`                       | App Store Connect API key ID (_Users and Access → Integrations → App Store Connect API_, role **App Manager**) |
| `ASC_API_ISSUER_ID`                    | Issuer UUID on the same page                                                                                   |
| `ASC_API_KEY_P8_BASE64`                | `base64 -i AuthKey_XXXX.p8`                                                                                    |

Sketch (not yet run, so verify on a test branch first):

```yaml
build-ipa-dev:
  name: Build iOS — TestFlight Internal (develop)
  runs-on: macos-15
  needs: [build, security-audit]
  if: >-
    github.event_name == 'push' &&
    (github.ref_name == 'develop' || github.ref_name == 'development')
  steps:
    - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4
    - uses: pnpm/action-setup@v4
      with: { version: 9.15.0 }
    - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
      with: { node-version: 20, cache: pnpm }
    - run: pnpm install --frozen-lockfile
    - name: Write env + Firebase config
      run: |
        cat > apps/mobile/.env.development <<'EOF'
        API_URL=${{ secrets.MOBILE_API_URL_DEV }}
        APP_ENV=development
        GOOGLE_GEOCODING_API_KEY=${{ secrets.GOOGLE_GEOCODING_API_KEY }}
        SENTRY_DSN=
        POSTHOG_KEY=
        POSTHOG_HOST=
        EOF
        echo "${{ secrets.IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64 }}" | base64 --decode > apps/mobile/ios/EduCard/GoogleService-Info.plist
        echo "${{ secrets.ASC_API_KEY_P8_BASE64 }}" | base64 --decode > "$RUNNER_TEMP/AuthKey.p8"
    - name: Pods
      working-directory: apps/mobile/ios
      run: bundle install && bundle exec pod install
    - name: Archive + upload
      working-directory: apps/mobile/ios
      env:
        ENVFILE: .env.development
      run: |
        AUTH="-authenticationKeyPath $RUNNER_TEMP/AuthKey.p8 -authenticationKeyID ${{ secrets.ASC_API_KEY_ID }} -authenticationKeyIssuerID ${{ secrets.ASC_API_ISSUER_ID }}"
        xcodebuild -workspace EduCard.xcworkspace -scheme EduCard -configuration Release \
          -destination 'generic/platform=iOS' -archivePath build/EduCard.xcarchive \
          -allowProvisioningUpdates $AUTH \
          DEVELOPMENT_TEAM=${{ secrets.APPLE_TEAM_ID }} CURRENT_PROJECT_VERSION=${{ github.run_number }} archive
        test "$(cat /tmp/envfile)" = ".env.development"
        sed -i '' "s/YOUR_TEAM_ID/${{ secrets.APPLE_TEAM_ID }}/" ExportOptions-TestFlightInternal.plist
        xcodebuild -exportArchive -archivePath build/EduCard.xcarchive \
          -exportOptionsPlist ExportOptions-TestFlightInternal.plist -exportPath build/export \
          -allowProvisioningUpdates $AUTH
```

`CURRENT_PROJECT_VERSION=${{ github.run_number }}` keeps build numbers increasing.
The first CI build number must be higher than any build you uploaded manually.

---

## 10. Troubleshooting

| Symptom                                                                                     | Fix                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App hits the wrong backend                                                                  | `cat /tmp/envfile` right after the build. If it says `.env.production`, `ENVFILE` didn't reach the pre-action: apply §2.2a, and for the GUI launch Xcode from the terminal (§5 A1). Then _Product → Clean Build Folder_ and rebuild |
| Simulator Debug build can't reach the API                                                   | `.env` has no `API_URL`, so it falls back to `localhost:8000` (issue #3)                                                                                                                                                            |
| "No signing certificate / No Account for Team"                                              | Add the Apple ID in _Xcode → Settings → Accounts_. Your role must be Admin, App Manager or Developer with cert access                                                                                                               |
| Upload rejected: "bundle version must be higher"                                            | Bump the Build number (`CURRENT_PROJECT_VERSION`)                                                                                                                                                                                   |
| Upload rejected: "train closed / version already approved"                                  | Bump `MARKETING_VERSION` (e.g. `1.0` → `1.0.1`)                                                                                                                                                                                     |
| Archive fails at "Bundle React Native code and images" with `Cannot find module 'expo/...'` | Issue #6: run `pnpm install` from the repo root. Long-term, switch the phase to plain `react-native-xcode.sh`                                                                                                                       |
| Archive fails: `GoogleService-Info.plist` not found                                         | Copy it into `ios/EduCard/` (gitignored)                                                                                                                                                                                            |
| `pod install` errors after pulling `develop`                                                | `cd ios && bundle exec pod install --repo-update`                                                                                                                                                                                   |
| Build stuck in "Processing" > 1 h, or "Invalid Binary" email                                | Read the email from App Store Connect. Usually a missing `Info.plist` usage string or an invalid icon                                                                                                                               |
| Push notifications not arriving on TestFlight                                               | Upload the APNs `.p8` key to Firebase (§3.1 step 5). Notifications permission must be granted                                                                                                                                       |
| "Use my location" missing                                                                   | `GOOGLE_GEOCODING_API_KEY` is empty in the env file used                                                                                                                                                                            |
| "Use my location" → `REQUEST_DENIED`                                                        | The key is app-restricted. Use API restriction instead (§2.5)                                                                                                                                                                       |
| Tester doesn't see the build                                                                | Not added to the `Dev QA` group, invite not accepted, Automatic Distribution off, or signed in to TestFlight with a different Apple ID than the one invited                                                                         |

---

## 11. Before a real App Store release (from `main`)

See [`IOS_APP_STORE_PRODUCTION_RELEASE_GUIDE.md`](IOS_APP_STORE_PRODUCTION_RELEASE_GUIDE.md).
