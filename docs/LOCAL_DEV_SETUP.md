# EduCard — Local Development Setup (Web + Mobile/Expo)

Self-contained guide to run the **web app** and the **Expo mobile app** locally, against the
local backend. Written so it can be followed without any AI assistant.

> Backend setup (Django/Postgres/Mailpit via Docker) is covered in
> [../educard-backend-api/LOCAL_DOCKER_SETUP.md](../educard-backend-api/LOCAL_DOCKER_SETUP.md) —
> do that first, the frontend needs it running.

---

## 0. Prerequisites

| Tool        | Version    | Check                                                                                 |
| ----------- | ---------- | ------------------------------------------------------------------------------------- |
| Node.js     | >= 18      | `node -v`                                                                             |
| pnpm        | >= 9       | `pnpm -v` (install: `npm install -g pnpm`)                                            |
| Docker      | any recent | for the backend, see LOCAL_DOCKER_SETUP.md                                            |
| Expo Go app | latest     | on your physical phone, from App/Play Store (only needed for physical-device testing) |

This workspace lives in WSL. Run all commands from a WSL shell:

```powershell
wsl -d Ubuntu
cd ~/workspace/educard-clients
```

---

## 1. Install dependencies (once, for the whole monorepo)

```bash
cd ~/workspace/educard-clients
pnpm install
```

This installs dependencies for `apps/web`, `apps/mobile`, and `packages/shared` in one go
(pnpm workspace, see `pnpm-workspace.yaml`).

> Whenever you pull changes that touch `package.json` / `pnpm-lock.yaml`, re-run `pnpm install`.

---

## 2. Start the backend first

```bash
cd ~/workspace/educard-backend-api
docker compose -f docker-compose.local.yml up -d
```

Confirm it's reachable: http://localhost:8000/api/docs/

---

## 3. Web App (Vite + React)

**Location:** `educard-clients/apps/web/`

### 3.1 Configure the API URL

The web app reads `VITE_API_BASE_URL` (falls back to a deployed Cloud Run URL if not set — you
want it pointing at your local backend). Create `apps/web/.env`:

```bash
cd ~/workspace/educard-clients/apps/web
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:8000/api
EOF
```

**⚠️ Important:** Web browsers must use `http://localhost:8000/api` (NOT `http://10.0.2.2:8000/api`). The `10.0.2.2` address is only for Android emulators - using it in a browser will cause CORS errors because the backend doesn't recognize it as a valid origin.

### 3.2 Run the dev server

```bash
# From the monorepo root
cd ~/workspace/educard-clients
pnpm dev:web

# OR directly from the web app folder
cd apps/web
pnpm dev
```

Opens at **http://localhost:5173**.

> **CORS Note:** The backend is configured to accept requests from `http://localhost:5173` and `http://127.0.0.1:5173`. If you see CORS errors in the browser console, restart the Django container: `docker-compose -f docker-compose.local.yml restart django` from the backend directory.

### 3.3 Other useful web commands

```bash
cd ~/workspace/educard-clients

pnpm build:web            # production build (tsc + vite build)
pnpm --filter @educard/web preview   # preview the production build locally
pnpm --filter @educard/web type-check    # tsc --noEmit
pnpm --filter @educard/web lint          # eslint
pnpm --filter @educard/web check:all     # types + lint + format check
```

---

## 4. Mobile App (Expo / React Native)

**Location:** `educard-clients/apps/mobile/`

### 4.1 Configure the API URL

Copy the example env file and adjust the API URL for how you'll run the app:

```bash
cd ~/workspace/educard-clients/apps/mobile
cp .env.example .env
```

Edit `.env` → `EXPO_PUBLIC_API_URL` depending on target:

| Running on                            | `EXPO_PUBLIC_API_URL` value                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Android Emulator                      | `http://10.0.2.2:8000/api` (emulator's alias for host machine's `localhost`)                                                                 |
| iOS Simulator                         | `http://localhost:8000/api`                                                                                                                  |
| Physical device (Expo Go, same Wi-Fi) | `http://<YOUR_LAN_IP>:8000/api` — find your LAN IP with `ipconfig` (Windows) or `ip addr` (Linux/WSL); the phone must be on the same network |
| Against deployed backend              | `https://educard-backend-api-272236662775.asia-south1.run.app/api` (already set in `.env.production`)                                        |

Only `.env.example` is checked into the repo (`.env`, `.env.local`, `.env.production` are
git-ignored). The `start:local` / `start:prod` npm scripts expect `.env.local` and `.env.production`
to exist — create them once per machine:

```bash
# One-time: create a "local backend" env file
cp .env.example .env.local
# then edit .env.local so EXPO_PUBLIC_API_URL matches the table above (emulator/simulator/device)

# One-time: create a "deployed backend" env file
cp .env.example .env.production
# then edit .env.production:
#   EXPO_PUBLIC_API_URL=https://educard-backend-api-272236662775.asia-south1.run.app/api
#   EXPO_PUBLIC_APP_ENV=production
```

After that, `pnpm start:local` / `pnpm start:prod` will just work (they run `cp .env.local .env`
or `cp .env.production .env` for you before starting Expo).

### 4.2 Start the Expo dev server

```bash
cd ~/workspace/educard-clients/apps/mobile

# Generic start — shows a QR code + a menu to pick a target
npx expo start
# or: pnpm --filter @educard/mobile start

# Start and immediately open Android emulator
npx expo start --android

# Start and immediately open iOS simulator (macOS only)
npx expo start --ios

# Start web preview (Expo's own web target — separate from apps/web)
npx expo start --web
```

Package-level shortcuts already defined in `apps/mobile/package.json`:

```bash
pnpm --filter @educard/mobile start          # expo start
pnpm --filter @educard/mobile start:local    # cp .env.local .env && expo start
pnpm --filter @educard/mobile start:prod     # cp .env.production .env && expo start
pnpm --filter @educard/mobile android        # expo run:android (builds a native dev client)
pnpm --filter @educard/mobile android:local  # cp .env.local .env && expo start --android
pnpm --filter @educard/mobile ios            # expo run:ios
```

### 4.3 Testing on a physical device

1. Install **Expo Go** from the App Store / Play Store.
2. Make sure your phone and computer are on the **same Wi-Fi network**.
3. Set `EXPO_PUBLIC_API_URL` in `.env` to your computer's LAN IP (see table above).
4. Run `npx expo start` and scan the QR code shown in the terminal with:
   - **Android**: the Expo Go app's scanner
   - **iOS**: the system Camera app (it will prompt to open in Expo Go)

### 4.4 Other useful mobile commands

```bash
cd ~/workspace/educard-clients/apps/mobile

pnpm test          # jest
pnpm lint          # eslint . --ext .ts,.tsx
pnpm lint:fix
pnpm typecheck     # tsc --noEmit
pnpm format
```

---

## 5. Running Everything Together (typical local dev session)

```bash
# Terminal 1 — backend
cd ~/workspace/educard-backend-api
docker compose -f docker-compose.local.yml up

# Terminal 2 — web
cd ~/workspace/educard-clients
pnpm dev:web

# Terminal 3 — mobile
cd ~/workspace/educard-clients/apps/mobile
npx expo start
```

---

## 6. Troubleshooting

| Symptom                                                            | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web app can't reach API (network error / CORS)                     | **CORS errors are common in local dev.** First, confirm backend is running (`docker ps`). Then verify: (1) `apps/web/.env` has `VITE_API_BASE_URL=http://localhost:8000/api` (**NOT** `10.0.2.2` - that's only for Android emulators), (2) Backend CORS is configured with `CORS_ALLOW_ALL_ORIGINS=True` in `config/settings/local.py`, (3) Restart Django container: `docker-compose -f docker-compose.local.yml restart django`, (4) **Hard refresh browser** (Ctrl+Shift+R / Cmd+Shift+R) or restart web dev server. Vite only reads `.env` at startup. |
| Android emulator can't reach `localhost:8000`                      | Use `10.0.2.2` instead of `localhost` in the emulator's `.env`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Physical device can't reach backend                                | Phone and computer must be on the same Wi-Fi network; use the computer's LAN IP, not `localhost`; check firewall isn't blocking port 8000.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Expo Go shows a blank/red error screen after JS change             | Shake device / press `r` in the terminal to reload; if it persists, stop and re-run `npx expo start -c` to clear the Metro bundler cache.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm install` fails on a package                                  | Delete `node_modules` via `pnpm run clean` (root `package.json` script) then reinstall.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Type errors unrelated to your change during `pnpm typecheck`/`tsc` | There is a known pre-existing baseline of ~60 TypeScript errors in this repo unrelated to any single feature (fee/holidays/leave/teachers modules). Don't treat those as something you broke — only worry about errors in files you touched.                                                                                                                                                                                                                                                                                                               |
