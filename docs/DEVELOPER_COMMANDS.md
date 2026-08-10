# Developer Commands (Daily Use)

Quick copy-paste commands for common tasks.

## 1) Start development servers

Run from repo root: `educard-clients/`

```bash
# Web app (Vite)
pnpm dev:web

# Mobile app (React Native CLI)
pnpm dev:mobile
```

If you want Android directly:

```bash
cd apps/mobile
pnpm start --android
```

If you want iOS directly (macOS):

```bash
cd apps/mobile
pnpm start --ios
```

## 2) Build commands

```bash
# Web build
pnpm build:web

# Mobile builds
pnpm build:mobile:ios
pnpm build:mobile:android
```

## 3) Quality checks

```bash
# Typecheck all workspaces
pnpm typecheck

# Lint all workspaces
pnpm lint

# Auto-fix lint issues
pnpm lint:fix
```

## 4) Git daily workflow

```bash
# Check changed files
git status

# Pull latest changes
git pull origin <branch-name>

# Stage your changes
git add .

# Commit
git commit -m "your message"

# Push
git push origin <branch-name>
```

## 5) New branch workflow

```bash
# Create and switch to a new branch
git checkout -b feature/<short-name>

# Push and set upstream
git push -u origin feature/<short-name>
```

## 6) Undo local uncommitted changes (careful)

```bash
# Revert tracked file changes
git restore .

# Remove untracked files/folders
git clean -fd
```

## 7) Clean and reinstall dependencies

```bash
pnpm clean
pnpm install
```

---

## Quick tips

- Keep **2 terminals** open during development:
  - Terminal 1: `pnpm dev:web`
  - Terminal 2: `pnpm dev:mobile`

---

## Need production deployment steps?

See [`PRODUCTION_RUNBOOK.md`](./PRODUCTION_RUNBOOK.md) for:

- Full GitHub PR workflow
- SonarQube/SonarCloud scans
- Vercel deployment
- Expo APK/AAB builds
- App Store submission
- Release tagging
