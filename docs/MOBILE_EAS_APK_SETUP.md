# Mobile APK & Production Build Guide (Expo EAS)

Steps to set up EAS for the mobile app (`apps/mobile`), build an installable **Android APK** that
points at the **Cloud Run** API, and later ship a **production** release.

- **Expo project:** Educard Org / `educard-dev-apk` (account slug `educard-org`)
- **Repo:** `EduSmartX/educard-clients`
- **Integration branch:** `develop`

---

## Prerequisites

- An Expo account that is a **member of Educard Org**.
- Node.js 20+ and dependencies installed (`pnpm install` at the repo root).
- EAS CLI installed: `npm i -g eas-cli` (verify with `eas --version`).

---

## 1. One-time project setup

```bash
cd apps/mobile

# Log in to Expo
eas login

# Link the repo to the Expo project — writes extra.eas.projectId into app.json
eas init                 # choose: educard-org / educard-dev-apk

# Point OTA updates at the linked project (sets expo.updates.url)
eas update:configure

# Verify linkage
eas project:info         # shows @educard-org/educard-dev-apk + Project ID
```

Commit the updated `app.json` (`extra.eas.projectId` + `expo.updates.url`) and push to `develop`.

---

## 2. Build profiles (already set in `apps/mobile/eas.json`)

| Profile      | Output | API URL                | Use for                         |
| ------------ | ------ | ---------------------- | ------------------------------- |
| `preview`    | APK    | Cloud Run (baked in)   | Internal testing / share an APK |
| `production` | AAB    | set before prod builds | Play Store release              |

`preview` already injects:
`EXPO_PUBLIC_API_URL=https://educard-backend-api-272236662775.asia-south1.run.app/api`

---

## 3. Build an APK (preview → Cloud Run)

Pick any one:

- **EAS CLI**
  ```bash
  cd apps/mobile
  eas build --platform android --profile preview
  ```
- **GitHub Action** — push to `develop` touching `apps/mobile/**`, or run
  **Actions → Mobile APK Build (EAS) → Run workflow**. Requires `EXPO_TOKEN` (see §4).
- **PR label** — add the label `eas-build-android:preview` to a Pull Request.

Download the APK from **expo.dev → Educard Org → educard-dev-apk → Builds** and install it on the
device. The first build auto-generates the Android signing keystore.

---

## 4. CI setup — `EXPO_TOKEN`

The GitHub Action authenticates to Expo with a token. This is **separate** from the `app.json`
`projectId` (which only identifies which project to build) — both are needed for an automated build.

1. **Create a personal access token**
   expo.dev → avatar → **Account settings → Access tokens → Create token** → copy it once.
   Use an account that is a member of Educard Org.
2. **Add it as a GitHub repository secret**
   GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
   → name **`EXPO_TOKEN`**, value = the token.

**Timing:** add `EXPO_TOKEN` **before** the first push that triggers the workflow. Its order
relative to `eas init` does not matter — they are independent. Not required if you only build
manually with `eas build`.

Recommended first-run order:

1. `eas login` → `eas init` (writes the projectId into `app.json`).
2. Add `EXPO_TOKEN` to GitHub secrets.
3. Commit + push `app.json` to `develop` → the Action builds the APK.

---

## 5. Production deployment

1. **Set the production API URL** in `apps/mobile/eas.json` under the `production` profile:
   ```jsonc
   "production": {
     "env": {
       "EXPO_PUBLIC_API_URL": "https://<production-api-url>/api"
     },
     "channel": "production",
     "autoIncrement": true
   }
   ```
2. **Build the release (AAB for Play Store)**
   ```bash
   cd apps/mobile
   eas build --platform android --profile production
   ```
   Need an installable APK instead of an AAB? Add a `production-apk` profile with
   `"android": { "buildType": "apk" }` and build that.
3. **Submit to Google Play**
   ```bash
   eas submit --platform android --profile production
   ```
   Requires a Google Play service-account key in `eas.json` → `submit.production.android`.
4. **Ship JS-only updates over the air (no rebuild)**
   ```bash
   eas update --branch production --message "What changed"
   ```
   Installed production builds on the `production` channel pick it up on next launch.

---

## Notes

- Always run EAS commands from **`apps/mobile/`**.
- `preview` = testable APK (Cloud Run URL baked in). `production` = Play Store AAB — set its
  `EXPO_PUBLIC_API_URL` before building, or it falls back to a local URL.
- Version bumps: `app.json → expo.version`; `production` uses `autoIncrement` for the build number.
