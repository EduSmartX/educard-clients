# Mobile APK Build via EAS — Status & Next Steps

Goal: generate an **Android APK** for the Expo mobile app (`apps/mobile`) that connects to the
**Cloud Run** API, using the Expo project **Educard Org / educard-dev-apk** (account slug
`educard-org`).

> This machine is behind a **Zscaler** TLS proxy, so Node / EAS CLI network calls fail with
> `unable to get local issuer certificate`. The browser (Expo dashboard) works fine. Run the CLI
> steps on a device **without** Zscaler, or use the workaround at the bottom.

---

## DONE (already committed on `develop`)

- **`apps/mobile/eas.json`** — the `preview` profile builds an installable **APK**
  (`android.buildType: "apk"`) and injects the Cloud Run URL:
  `EXPO_PUBLIC_API_URL=https://educard-backend-api-272236662775.asia-south1.run.app/api`.
- **`apps/mobile/app.json`** — pointed at the new project:
  - `owner` → `educard-org`
  - `slug` → `educard-dev-apk`
  - ⚠️ `extra.eas.projectId` and `expo.updates.url` still hold the **old** IDs — these get
    overwritten by `eas init` (TODO #2).
- **`.github/workflows/mobile-build.yml`** — GitHub Action that runs an EAS Android APK build
  (`preview` profile) on push to `develop`/`development` touching `apps/mobile/**` or
  `packages/shared/**`, plus a manual `workflow_dispatch`. Needs the `EXPO_TOKEN` secret (TODO #5).
- **Expo dashboard** — GitHub repo `EduSmartX/educard-clients` connected; base directory
  `/apps/mobile`.

---

## TODO (run on a device with a working CLI / no Zscaler)

1. **Install + log in**

   ```bash
   npm i -g eas-cli        # or: pnpm dlx eas-cli@latest <cmd>
   eas login               # Expo account that is a member of Educard Org
   ```

2. **Link the project (writes the correct `projectId` into `app.json`)**

   ```bash
   cd apps/mobile
   eas init --force        # choose: educard-org / educard-dev-apk
   ```

3. **Sync the OTA updates URL** (if `eas init` didn't already)

   ```bash
   eas update:configure
   # or manually set app.json → expo.updates.url = https://u.expo.dev/<new-projectId>
   ```

4. **Commit the updated `app.json`** (`projectId` + `updates.url`) and push to `develop`.

5. **Create `EXPO_TOKEN` for CI**
   - expo.dev → avatar → **Account settings → Access tokens → Create token**.
   - GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
     → name `EXPO_TOKEN`, value = the token.

6. **Trigger a build** (any one)
   - **GitHub Action:** push to `develop` touching `apps/mobile/**`, or run
     **Actions → Mobile APK Build (EAS) → Run workflow**.
   - **EAS CLI:** `eas build --platform android --profile preview`
   - **Expo GitHub label:** add the label `eas-build-android:preview` to a PR.

7. **Download the APK** from expo.dev → **Educard Org → educard-dev-apk → Builds**, then install
   on the device.

---

## Notes / gotchas

- Always build from **`apps/mobile/`** — there is a stale root `eas.json`/`app.json` that must not
  be used.
- `preview` = APK + Cloud Run URL. `production` = AAB and currently has **no**
  `EXPO_PUBLIC_API_URL` (it would fall back to localhost) — fix that before ever building
  `production`.
- The first build makes EAS **auto-generate** the Android signing keystore (no manual step).

---

## Zscaler workaround (only if you must run the CLI on the corporate machine)

Node ships its own CA bundle and does not trust the Zscaler root. The Zscaler root CA has been
exported from the Windows trust store to `%USERPROFILE%\zscaler-ca.pem`. Point Node at it, and note
the two other environment quirks on this box:

- run WSL as **root** (`-u root`) — the reprovisioned default user is broken,
- use **`pnpm dlx`**, not `npx` (npx resolves to Windows npm and crashes).

```bash
wsl -d Ubuntu -u root bash -lc 'cd /root/workspace/educard-clients/apps/mobile && \
  NODE_EXTRA_CA_CERTS=/mnt/c/Users/H647259/zscaler-ca.pem pnpm dlx eas-cli@latest login'
```

Set `NODE_EXTRA_CA_CERTS=/mnt/c/Users/H647259/zscaler-ca.pem` for **every** `eas` command on this
machine (login, init, build).
