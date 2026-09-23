# Vercel CI/CD Deployment Setup (Web)

This document explains **exactly** how the web app (`apps/web`) is deployed to Vercel via GitHub Actions, for both Development and Production, and clears up a common point of confusion around GitHub "Environments."

> ⚠️ Superseded doc: an earlier version of this file referenced a separate
> `.github/workflows/vercel-deploy.yml` file. That file no longer exists —
> all deploy logic now lives in `.github/workflows/ci.yml` (jobs
> `deploy-web-dev` and `deploy-web-prod`). This doc reflects the current
> workflow.

## Goal

- Deploy **Development** builds when `develop` or `development` is pushed.
- Deploy **Production** builds when `main` or `master` is pushed.
- Gate deploys on `build` + `security-audit` jobs succeeding (lint/typecheck/format run earlier and must pass for `build` to run).

## Workflow File

Single workflow: `.github/workflows/ci.yml`

Relevant jobs:

| Job               | Trigger condition                                       | Purpose                                              |
| ----------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `build`           | any push/PR (needed by both deploy jobs)                | Builds the web app once, uploads artifact            |
| `security-audit`  | any push/PR                                             | Dependency audit (non-blocking, `continue-on-error`) |
| `deploy-web-dev`  | `push` **and** `ref_name` is `develop` or `development` | Pull → build → deploy to the **Dev** Vercel project  |
| `deploy-web-prod` | `push` **and** `ref_name` is `main` or `master`         | Pull → build → deploy to the **Prod** Vercel project |
| `build-apk`       | `push` on `develop`/`development`                       | Builds Android APK using the **dev** backend URL     |

## Branch → Vercel Project Mapping

- `develop` / `development` → Vercel **Dev** project (`VERCEL_PROJECT_ID_DEV`)
- `main` / `master` → Vercel **Prod** project (`VERCEL_PROJECT_ID_PROD`)

Both jobs run the same 3-step Vercel CLI pattern:

```bash
vercel pull   --environment=preview|production --token=$VERCEL_TOKEN
vercel build  [--prod]                          --token=$VERCEL_TOKEN
vercel deploy --prebuilt [--prod]                --token=$VERCEL_TOKEN
```

- Dev uses `--environment=preview` (no `--prod` flags).
- Prod uses `--environment=production` and passes `--prod` to both `build` and `deploy`.

## ⚠️ Important: These Secrets Are Repository Secrets, NOT GitHub Environment Secrets

Neither `deploy-web-dev` nor `deploy-web-prod` declares a job-level
`environment:` key. That means every `${{ secrets.X }}` reference in these
jobs resolves against **plain repository secrets**
(Settings → Secrets and variables → Actions → _Repository secrets_).

This is why a deploy can succeed even if the GitHub **Environments** page
(Settings → Environments) has no entry named `development`. Those
Environments entries you may see (e.g. `Preview – educard-clients`,
`Production – educard-clients-web-production`) are created automatically by
**Vercel's own GitHub App integration** for deployment-status tracking — they
are a completely separate mechanism from GitHub Actions secrets and are not
read by this workflow at all.

If you ever want to scope secrets per environment (e.g. require manual
approval before a prod deploy), you would need to explicitly add
`environment: production` to the `deploy-web-prod` job and move the prod
secrets into a matching GitHub Environment named `production`. **This repo
does not currently do that** — all secrets are repository-wide.

## Required GitHub Repository Secrets

Add these under **Settings → Secrets and variables → Actions → Repository secrets**:

| Secret                                                                                                 | Used by              | Notes                                                                        |
| ------------------------------------------------------------------------------------------------------ | -------------------- | ---------------------------------------------------------------------------- |
| `VERCEL_TOKEN`                                                                                         | dev + prod           | Shared. From Vercel → Account Settings → Tokens                              |
| `VERCEL_ORG_ID`                                                                                        | dev + prod           | Shared. From `.vercel/project.json` after `vercel link`, or Project Settings |
| `VERCEL_PROJECT_ID_DEV`                                                                                | dev only             | Vercel Dev project ID                                                        |
| `VERCEL_PROJECT_ID_PROD`                                                                               | prod only            | Vercel Prod project ID                                                       |
| `VITE_API_BASE_URL_DEV`                                                                                | dev only             | Backend URL baked into dev build                                             |
| `VITE_API_BASE_URL_PROD`                                                                               | prod only            | Backend URL baked into prod build                                            |
| `MOBILE_API_URL_DEV`                                                                                   | `build-apk` job only | Backend URL baked into dev APK                                               |
| `SONAR_TOKEN`                                                                                          | `sonarcloud` job     | Not deploy-related but lives in same workflow                                |
| `ANDROID_KEYSTORE_BASE64` / `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD` | `build-apk` job      | Optional — falls back to debug keystore if unset                             |

## How to Get Vercel Values

### VERCEL_TOKEN

1. Vercel → Account Settings → Tokens → Create.
2. Save as `VERCEL_TOKEN`.

### VERCEL*ORG_ID and VERCEL_PROJECT_ID*\*

Option A — from Project Settings in the Vercel dashboard (General tab shows both IDs).

Option B — from CLI:

```bash
vercel link   # run inside apps/web, select the correct project
cat .vercel/project.json   # shows orgId and projectId
```

Repeat for both the Dev project and the Prod project; `orgId` should be the
same for both (same team), `projectId` differs.

## Vercel Project Structure (recommended)

Two separate Vercel projects, both connected to this same GitHub repo:

- `educard-web-dev` — previews / development builds
- `educard-web-prod` — Production Branch = `main`

Keeping them separate isolates environment variables, domains, and deploy
history between dev and prod.

## Native Vercel Git Integration Should Be Disabled

Because GitHub Actions controls deploys explicitly (`vercel deploy --prebuilt`),
`vercel.json` disables Vercel's automatic Git-push deploys to avoid duplicate
builds:

```json
{
  "git": { "deploymentEnabled": false }
}
```

Confirm this is `false` for both projects if Vercel ever starts deploying on
its own in addition to the Actions-triggered deploy.

## Deployment Flow Summary

**Development:**

1. Push to `develop` or `development`.
2. `build` + `security-audit` run.
3. `deploy-web-dev` pulls Dev project config, builds with `VITE_API_BASE_URL_DEV`, deploys (preview mode) to the Dev Vercel project.
4. (Same push also triggers `build-apk` to produce a signed/debug APK using `MOBILE_API_URL_DEV`.)

**Production:**

1. Push to `main` or `master` (e.g. after merging a release PR).
2. `build` + `security-audit` run.
3. `deploy-web-prod` pulls Prod project config, builds with `VITE_API_BASE_URL_PROD` and `--prod`, deploys with `--prod` to the Prod Vercel project.

## Validation Checklist

- [ ] All 6 core secrets above exist as **repository** secrets (not environment secrets).
- [ ] Push to `develop`/`development` → `deploy-web-dev` job runs and succeeds → site updates on Dev Vercel project.
- [ ] Push to `main`/`master` → `deploy-web-prod` job runs and succeeds → site updates on Prod Vercel project + production domain.
- [ ] `vercel.json` has `git.deploymentEnabled: false` on both projects (no duplicate auto-deploys).
- [ ] Vercel dashboard Environment Variables (Project → Settings → Environment Variables) match the values injected by CI, in case anyone triggers a manual `vercel deploy` locally.

## Rollback

- Vercel dashboard → Deployments → select a previous healthy deployment → "Promote to Production".
- Or re-run the `deploy-web-prod` / `deploy-web-dev` job from a previous good commit via `workflow_dispatch` / re-run.

## Related Docs

- `docs/VERCEL_PRODUCTION.md` — manual Vercel project setup steps (domains, production branch config).
- `apps/web/.env.production` — example Vite production env vars for local reference.
- `apps/mobile/.env.production` — example mobile production env vars.
