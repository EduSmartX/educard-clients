# Production Runbook (Manual CLI-First)

Use this file for **end-to-end manual release** without asking Copilot.

> Repo root assumed: `educard-clients/`

---

## 0) One-time setup (machine)

### Required tools

```bash
node -v
pnpm -v
git --version
gh --version
vercel --version
```

If missing:

```bash
npm install -g pnpm
npm install -g vercel
brew install gh
```

### Auth once

```bash
# GitHub CLI
gh auth login

# Vercel CLI
vercel login
```

### Sonar token (local shell)

```bash
export SONAR_TOKEN="<your_sonar_token>"
```

To persist on macOS `zsh`, add to `~/.zshrc`.

---

## 1) Update branch and install dependencies

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients

git checkout develop
git pull origin develop
pnpm install --frozen-lockfile
```

---

## 2) Start servers for local verification

```bash
# Terminal 1 (Web)
pnpm dev:web
```

```bash
# Terminal 2 (Mobile)
pnpm dev:mobile
```

Android directly:

```bash
cd apps/mobile
pnpm start --android
```

---

## 3) Pre-release quality gates (local)

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients

pnpm lint
pnpm typecheck
pnpm build:web
```

Optional dependency audit:

```bash
pnpm audit --prod --audit-level=high
```

---

## 4) SonarQube / SonarCloud checks

This repo already has `sonar-project.properties`.

### Option A: Use CI Sonar job (recommended)

Push branch and let `.github/workflows/ci.yml` run SonarCloud automatically.

### Option B: Manual scan from CLI

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients

sonar-scanner \
  -Dsonar.token="$SONAR_TOKEN"
```

If `sonar-scanner` is not installed, install it first (or rely on CI Sonar job).

---

## 5) Git + GitHub flow (manual)

### Create feature/release branch

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients

git checkout -b feature/<name>
```

### Commit and push

```bash
git status
git add .
git commit -m "feat: <what changed>"
git push -u origin feature/<name>
```

### Create PR via GitHub CLI

```bash
gh pr create \
  --base develop \
  --head feature/<name> \
  --title "feat: <title>" \
  --body "<summary + testing>"
```

### Watch CI checks

```bash
gh pr checks --watch
```

### Merge PR after approvals

```bash
gh pr merge --squash --delete-branch
```

---

## 6) Deploy Web to Vercel

Your `vercel.json` currently enables deployment from `develop`.

### Preview deploy (safe test)

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients
vercel
```

### Production deploy

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients
vercel --prod
```

### Useful Vercel CLI

```bash
vercel ls
vercel logs <deployment-url>
vercel inspect <deployment-url>
vercel env ls
vercel env pull .env.local
```

---

## 7) Build Android from Expo (APK / AAB)

Use `apps/mobile/eas.json` build profiles.

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
```

### Internal testing APK (preview profile)

```bash
eas build --platform android --profile preview
```

### Development APK (dev client)

```bash
eas build --platform android --profile development
```

### Production Play Store bundle (AAB)

```bash
eas build --platform android --profile production
```

### Force production APK (if needed outside Play Store)

Add this to `apps/mobile/eas.json` under `build`:

```json
"production-apk": {
  "extends": "production",
  "android": {
    "buildType": "apk"
  }
}
```

Then run:

```bash
eas build --platform android --profile production-apk
```

### Track and download builds

```bash
eas build:list --platform android
eas build:view <build-id>
eas build:download --platform android --latest
```

---

## 8) Build iOS from Expo

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
```

### Development simulator build

```bash
eas build --platform ios --profile development
```

### Preview Ad Hoc build

```bash
eas build --platform ios --profile preview
```

### Production App Store build

```bash
eas build --platform ios --profile production
```

---

## 9) Submit Android build to Play Console (optional)

If submit config is ready in `apps/mobile/eas.json`:

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients/apps/mobile
eas submit --platform android --profile production
```

### Submit iOS to App Store

```bash
eas submit --platform ios --profile production
```

---

## 10) Release tagging (optional but recommended)

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients

git checkout develop
git pull origin develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Create GitHub release notes:

```bash
gh release create v1.0.0 --generate-notes
```

---

## 11) Hotfix / rollback quick actions

### Hotfix branch

```bash
git checkout -b hotfix/<issue>
```

### Redeploy web quickly

```bash
vercel --prod
```

### Rebuild previous mobile commit

```bash
git checkout <known-good-commit>
cd apps/mobile
eas build --platform android --profile production
```

---

## 12) Minimal repeated daily command set

```bash
# Start web
pnpm dev:web

# Start expo
pnpm dev:mobile

# Quality checks
pnpm lint && pnpm typecheck && pnpm build:web

# Commit + push
git add . && git commit -m "<msg>" && git push
```

---

## 13) Secrets checklist (before production)

### GitHub Actions secrets

- `SONAR_TOKEN` (for SonarCloud CI job)
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (if using CI deploy)

### Local environment

- `.env.local` for web app
- `.env.local` for mobile app
- Play Store service account JSON for Android submit
- Apple credentials for iOS submit

---

## 14) Existing project docs

- `DEVELOPER_COMMANDS.md` → quick daily commands
- `DEPLOYMENT_GUIDE.md` → platform-focused deployment notes
- `.github/workflows/ci.yml` → current CI gates + SonarCloud job
- `README.md` → project overview and getting started

---

## 15) Common issues and fixes

### Port already in use (Web)

```bash
# Use different port
cd apps/web
npx vite dev --port 5174
```

### Expo package mismatch warnings

```bash
cd apps/mobile
npx expo install --fix
```

### Android emulator not detected

```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd <avd-name>

# Or use Expo Go on physical device
```

### Vercel build fails

```bash
# Clear cache and rebuild
vercel --force

# Check build logs
vercel logs <deployment-url>
```

### EAS build fails

```bash
# Check build logs
eas build:view --logs

# Clear Expo cache
cd apps/mobile
npx expo start --clear

# Reset credentials
eas credentials --platform android
```

---

## 16) Full end-to-end release checklist

- [ ] Pull latest `develop` branch
- [ ] Install dependencies (`pnpm install`)
- [ ] Run quality checks (`pnpm lint && pnpm typecheck`)
- [ ] Test locally (start web + mobile servers)
- [ ] Create feature/release branch
- [ ] Commit and push changes
- [ ] Create PR on GitHub
- [ ] Wait for CI checks (lint, typecheck, build, SonarCloud)
- [ ] Get PR approvals
- [ ] Merge PR to `develop`
- [ ] Deploy web to Vercel (`vercel --prod`)
- [ ] Build Android APK/AAB (`eas build --platform android --profile production`)
- [ ] Build iOS IPA (`eas build --platform ios --profile production`)
- [ ] Download builds (`eas build:download`)
- [ ] Test builds on devices
- [ ] Submit to Play Store/App Store (optional: `eas submit`)
- [ ] Create git tag (`git tag v1.0.0`)
- [ ] Create GitHub release (`gh release create v1.0.0`)
- [ ] Update changelog
- [ ] Notify team

---

## 17) Additional Vercel commands

### Environment variables

```bash
# Add new environment variable
vercel env add VITE_API_URL production

# List all environment variables
vercel env ls

# Pull environment variables to local
vercel env pull .env.local

# Remove environment variable
vercel env rm VITE_API_URL production
```

### Domains

```bash
# Add domain
vercel domains add example.com

# List domains
vercel domains ls

# Remove domain
vercel domains rm example.com
```

### Deployments

```bash
# List all deployments
vercel ls

# Remove deployment
vercel rm <deployment-url>

# Alias deployment
vercel alias <deployment-url> <custom-domain>
```

---

## 18) Additional EAS commands

### Credentials management

```bash
# View credentials
eas credentials

# Reset Android keystore
eas credentials --platform android --reset

# Reset iOS certificates
eas credentials --platform ios --reset
```

### Build configuration

```bash
# Initialize EAS in project
eas init

# Configure build
eas build:configure

# View build configuration
cat eas.json
```

### Updates (OTA)

```bash
# Publish update
eas update --branch preview --message "Bug fixes"

# List updates
eas update:list

# View update
eas update:view <update-id>

# Delete update
eas update:delete <update-id>
```

---

## 19) SonarQube local setup (optional)

### Install SonarScanner

```bash
# macOS
brew install sonar-scanner

# Verify installation
sonar-scanner --version
```

### Run scan

```bash
cd /Users/sivakkumar/Projects/Educard/educard-clients

sonar-scanner \
  -Dsonar.projectKey=EduSmartX_educard-clients \
  -Dsonar.organization=edusmartx \
  -Dsonar.sources=apps/web/src,apps/mobile/src,apps/mobile/app,packages/shared/src \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token="$SONAR_TOKEN"
```

---

## 20) GitHub CLI advanced

### PR management

```bash
# List all PRs
gh pr list

# View PR details
gh pr view <pr-number>

# Checkout PR locally
gh pr checkout <pr-number>

# Review PR
gh pr review --approve

# Add comment to PR
gh pr comment <pr-number> --body "LGTM"
```

### Issue management

```bash
# Create issue
gh issue create --title "Bug: Login fails" --body "Description"

# List issues
gh issue list

# View issue
gh issue view <issue-number>

# Close issue
gh issue close <issue-number>
```

### Release management

```bash
# List releases
gh release list

# View release
gh release view v1.0.0

# Delete release
gh release delete v1.0.0

# Upload asset to release
gh release upload v1.0.0 app-release.apk
```

---

## Support

For issues or questions:

- Vercel Docs: https://vercel.com/docs
- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- GitHub CLI: https://cli.github.com/manual/
- SonarCloud: https://sonarcloud.io/documentation/
