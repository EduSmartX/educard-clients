# Environment Variables & CI Secrets

This document lists the environment variables to configure for Vercel (Preview / Production) and the GitHub repository secrets used by the repository's CI (GitHub Actions). It includes recommended formats, example values used in this project, and a quick verification checklist.

## Summary — what to set where

- Vercel (Project → Settings → Environment Variables)
  - Set VITE_API_BASE_URL in the Production environment to the production API (includes `/api`).
  - Set VITE_API_BASE_URL in the Preview / Dev project to the dev API URL (includes `/api`).
  - Add other Vite prefixed branding/feature toggles (VITE_APP_NAME, VITE_APP_ENVIRONMENT, VITE_ENABLE_ANALYTICS, etc.) as needed.

- GitHub repository secrets (Settings → Secrets and variables → Actions)
  - CI and build secrets used by `.github/workflows/ci.yml` (VERCEL*TOKEN, VERCEL*_ IDs, VITE*API_BASE_URL_DEV, VITE_API_BASE_URL_PROD, MOBILE_API_URL_DEV, ANDROID*_ signing secrets, SONAR_TOKEN, ...)

## Required Vercel environment variables (recommended)

Production (Vercel project → Production Environment)

- VITE_API_BASE_URL
  - Purpose: baked into the production web bundle and read by the web app via `import.meta.env.VITE_API_BASE_URL`.
  - Format: HTTPS, include `/api`, no trailing slash.
  - Example: `https://api.educard.info/api`

- VITE_APP_ENVIRONMENT
  - Purpose: enable environment-specific behavior in the app.
  - Example: `production`

- VITE_APP_VERSION
  - Purpose: show app version in UI or for debugging.
  - Example: `1.2.3`

- VITE_ENABLE_ANALYTICS, VITE_ENABLE_DEV_TOOLS, VITE_APP_NAME, VITE_COMPANY_NAME, SENTRY_DSN, POSTHOG_KEY, POSTHOG_HOST (set as used)

Preview / Dev (Vercel project → Preview Environment)

- VITE_API_BASE_URL
  - Purpose: baked into preview/dev web bundles.
  - Example: `https://educard-backend-api-272236662775.asia-south1.run.app/api`
  - Note: the CI `deploy-web-dev` job also injects `VITE_API_BASE_URL` from the GitHub secret `VITE_API_BASE_URL_DEV` when building — keep them in sync to avoid surprises.

- VITE_APP_ENVIRONMENT
  - Example: `development`

- VITE_ENABLE_DEV_TOOLS
  - Example: `true` in preview

## GitHub repository secrets (used by GitHub Actions)

Add these under: Repository → Settings → Secrets and variables → Actions → New repository secret.

Core Vercel deploy secrets

- VERCEL_TOKEN
  - Purpose: Vercel CLI authentication used by `pnpm dlx vercel pull/build/deploy` in CI.
- VERCEL_ORG_ID
  - Purpose: org id passed to Vercel CLI commands.
- VERCEL_PROJECT_ID_DEV
  - Purpose: Dev/preview project id (used in `deploy-web-dev`).
- VERCEL_PROJECT_ID_PROD
  - Purpose: Prod project id (used in `deploy-web-prod`).

Web build secrets (used to bake base URLs into the web bundle)

- VITE_API_BASE_URL_DEV
  - Purpose: used by `deploy-web-dev` during the `vercel build` step.
  - Value example: `https://educard-backend-api-272236662775.asia-south1.run.app/api`

- VITE_API_BASE_URL_PROD
  - Purpose: used by `deploy-web-prod` during the `vercel build --prod` step.
  - Value example: `https://api.educard.info/api`

Mobile / APK build secrets

- MOBILE_API_URL_DEV
  - Purpose: written into `apps/mobile/.env.production` as `API_URL` by the `build-apk` job.
  - Requirements: must include `/api` and be publicly reachable (HTTPS) for device testing.
  - Value example: `https://educard-backend-api-272236662775.asia-south1.run.app/api`

- MOBILE_API_URL_PROD (optional)
  - Purpose: if you later build production mobile artifacts from CI.

Android signing secrets (for `build-apk` job)

- ANDROID_KEYSTORE_BASE64
  - Purpose: base64 single-line content of `release.keystore` (CI decodes this into a file).
- ANDROID_KEYSTORE_PASSWORD
- ANDROID_KEY_ALIAS
- ANDROID_KEY_PASSWORD

Other CI secrets

- SONAR_TOKEN (SonarCloud)
- SENTRY_DSN, POSTHOG_KEY (if you prefer storing telemetry keys in secrets)

## Formatting rules & best practices

- Include `/api` in API base URLs. The web and mobile code in this repo expect the base URL to include the `/api` suffix (see `apps/web` fallbacks and examples).

- Do not include a trailing slash. Example:
  - Good: `https://educard-backend-api-272236662775.asia-south1.run.app/api`
  - Avoid: `https://.../api/`

  Rationale: the client code appends request paths with a leading slash (e.g. `${API_BASE_URL}/auth/login`). A trailing slash in the base can produce `.../api//auth` (usually tolerated but messy and can cause edge-case issues).

- Keep Vercel project environment variables and GitHub secrets in sync for the same environment to avoid inconsistencies between automatic CI deploys and manual Vercel builds.

- Only set secrets as repository secrets if they are used directly by GitHub Actions. For values only required by Vercel manual builds, `Vercel → Project Settings → Environment Variables` is sufficient.

## Example `apps/web/.env.production`

(Used for local reference; CI and Vercel will normally supply these values)

```
VITE_API_BASE_URL=https://educard-backend-api-272236662775.asia-south1.run.app/api
VITE_APP_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=EduCard
```

## Example `apps/mobile/.env.production` (generated in CI `build-apk` job)

The `build-apk` job writes this file from `MOBILE_API_URL_DEV` (for dev builds):

```
API_URL=https://educard-backend-api-272236662775.asia-south1.run.app/api
APP_ENV=development
SENTRY_DSN=
POSTHOG_KEY=
POSTHOG_HOST=
```

## Quick verification checklist

1. Add GitHub repo secrets:
   - `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_DEV`, `VERCEL_PROJECT_ID_PROD`
   - `VITE_API_BASE_URL_DEV`, `VITE_API_BASE_URL_PROD`
   - `MOBILE_API_URL_DEV`
   - `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (if you want release signing)
   - `SONAR_TOKEN` (optional)

2. In Vercel (Dev project) add `VITE_API_BASE_URL` (Preview) = `https://educard-backend-api-272236662775.asia-south1.run.app/api`.
3. In Vercel (Prod project) add `VITE_API_BASE_URL` (Production) = `https://api.educard.info/api` (or your production host).
4. Push a change to `develop`/`development` and confirm `deploy-web-dev` runs and the preview site points at the dev backend.
5. Confirm `build-apk` runs and that the generated `educard-mobile-dev-release.apk` was built with `API_URL=.../api`.
6. Push to `main`/`master` and confirm `deploy-web-prod` runs and production site uses the prod URL.

## Troubleshooting

- If API requests show `404`/`CORS`/`network` errors in preview/mobile:
  - Confirm the API URL is publicly reachable and uses HTTPS for real devices.
  - Confirm `VITE_API_BASE_URL` / `MOBILE_API_URL_DEV` include `/api`.
  - Check for accidental trailing slash in the secret (remove it).

- If APK build signs with debug key (not release):
  - Confirm `ANDROID_KEYSTORE_BASE64` and the three credentials are set and valid.
  - Ensure the base64 is a single-line string (use `base64 -w 0` or `base64 -i release.keystore | tr -d '\n'` on macOS).

---

If you want, I can also:

- Add the same content to the repository README or link from `docs/VERCEL_CICD_DEPLOYMENT.md`.
- Create a small script/checker that verifies the current GitHub secrets and Vercel env variables (requires access tokens).

## Obtaining and configuring VITE_GOOGLE_MAPS_API_KEY

The web app uses `VITE_GOOGLE_MAPS_API_KEY` for address forms and geocoding utilities. Follow the steps below to create a key in Google Cloud, restrict it (strongly recommended), and add it to Vercel and CI.

1. Create a Google Cloud API key (Console)

- Go to Google Cloud Console → APIs & Services → Credentials → Create Credentials → API key.
- Copy the generated key (it will look like `AIza...`).

2. Enable required APIs

- In Google Cloud Console → APIs & Services → Library, enable these APIs for the project:
  - Maps JavaScript API (for map UI)
  - Geocoding API (for address lookup / reverse geocoding)
  - Places API (if you use place autocomplete)

### ⚠️ Important: Vercel env vars do NOT reach the mobile app

`VITE_GOOGLE_MAPS_API_KEY` set in Vercel is **web-only**. It is injected by Vite at build time and only ends up in the `apps/web` JS bundle that Vercel serves. The mobile app (`apps/mobile`) is built separately by Gradle/Xcode/EAS and never reads Vercel environment variables or anything prefixed `VITE_`.

The two apps use **two different variable names, in two different places**:

|                  | Web (`apps/web`)                                                                             | Mobile (`apps/mobile`)                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Variable name    | `VITE_GOOGLE_MAPS_API_KEY`                                                                   | `GOOGLE_GEOCODING_API_KEY`                                                                                           |
| Read in code     | `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` (`apps/web/src/components/form/address-form.tsx`) | `Config.GOOGLE_GEOCODING_API_KEY` via `react-native-config` (`apps/mobile/src/lib/location.ts`)                      |
| Where it's set   | Vercel → Project → Settings → Environment Variables                                          | `apps/mobile/.env`, `.env.production`, `.env.preview` (or written by CI from a GitHub secret in the `build-apk` job) |
| Restriction type | HTTP referrer (web domain)                                                                   | Android package name + SHA-1 fingerprint (and/or iOS bundle ID)                                                      |

So: **create one key per platform** (or one key with both restriction types added — not recommended since it weakens restriction), and set each in its own place under its own name.

3. Restrict the API key (important — do this separately for each key)
   - Click the API key in Credentials → Key restrictions.
   - **For the web key** — Application restrictions → HTTP referrers (web sites): add your exact Vercel domains, e.g. `https://your-preview-domain.vercel.app/*` and `https://your-production-domain.vercel.app/*` (and any custom domain).
   - **For the mobile key** — Application restrictions → Android apps: add your package name (e.g. `com.educardmobile`) and the SHA-1 certificate fingerprint of the signing keystore (debug and/or release — see command below). For iOS, use "iOS apps" restriction with your bundle identifier.
   - API restrictions (both keys): restrict to only the APIs you enabled — Maps JavaScript API + Places API for web, Geocoding API for mobile (add Maps SDK for Android/iOS if you render native maps).

   Get the SHA-1 fingerprint for the Android restriction:

   ```bash
   # Release keystore
   keytool -list -v -keystore apps/mobile/android/app/release.keystore -alias YOUR_ALIAS | grep SHA1

   # Debug keystore (used by local/dev builds)
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android | grep SHA1
   ```

4. Add the **web** key to Vercel
   - Vercel project → Settings → Environment Variables → add `VITE_GOOGLE_MAPS_API_KEY` for both Preview and Production environments (use the web-restricted key value).
   - It becomes available at build time as `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`, baked into the deployed bundle.

5. Add the **mobile** key to the mobile build
   - Local dev: put `GOOGLE_GEOCODING_API_KEY=<mobile-key>` in `apps/mobile/.env` (see `.env.example`).
   - CI (`build-apk` job in `.github/workflows/ci.yml`): add a GitHub repo secret, e.g. `MOBILE_GOOGLE_GEOCODING_API_KEY`, then add a line to the "Generate release env file" step so it's written into `apps/mobile/.env.production`:
     ```yaml
     - name: Generate release env file (dev backend)
       run: |
         cat > apps/mobile/.env.production <<'EOF'
         API_URL=${{ secrets.MOBILE_API_URL_DEV }}
         APP_ENV=development
         GOOGLE_GEOCODING_API_KEY=${{ secrets.MOBILE_GOOGLE_GEOCODING_API_KEY }}
         SENTRY_DSN=
         POSTHOG_KEY=
         POSTHOG_HOST=
         EOF
     ```
   - Note: anything baked into an APK can be extracted by a determined user — this is why the Android package-name + SHA-1 restriction on the key (step 3) matters, not secrecy of the string itself.

6. Quick gcloud commands (optional, alternative to Console)

   ```bash
   # Enable APIs
   gcloud services enable maps.googleapis.com maps-android-backend.googleapis.com \
     geocoding-backend.googleapis.com places-backend.googleapis.com \
     --project=YOUR_PROJECT_ID

   # Create an API key
   gcloud alpha services api-keys create --display-name="educard-web-maps-key" --project=YOUR_PROJECT_ID
   gcloud alpha services api-keys create --display-name="educard-mobile-geocoding-key" --project=YOUR_PROJECT_ID

   # List API keys (to get the keyId, then use `gcloud alpha services api-keys get-key-string KEY_ID`)
   gcloud alpha services api-keys list --project=YOUR_PROJECT_ID
   ```

   Restricting via `gcloud` requires an `api-target` / `restrictions` config file — it's simpler to apply restrictions via the Console UI (step 3) unless you're scripting this repeatedly.

Notes:

- Never reuse the same unrestricted key for both platforms — restrict each one to its own platform/domain to prevent quota theft if the key leaks.
- Keep production keys only in the Production Vercel env / a prod-only GitHub secret; use separate dev/preview keys so a compromised dev key can't affect production billing or quota.
- Mark any key stored in GitHub Secrets as a secret (never echo it in workflow logs).
