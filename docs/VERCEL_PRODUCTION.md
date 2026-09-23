Vercel production setup — main branch → separate Vercel project

This short guide shows the minimal, repeatable steps to host a separate Vercel production deployment that tracks the `main` branch and points the web app at a different backend URL than your preview/dev deployments.

Why: the repo already supports per-environment Vite env vars (VITE*API_BASE_URL*\*) and GitHub Actions injects VITE_API_BASE_URL for CI builds. For Vercel you want a production project that:

- Deploys only when `main` is pushed
- Uses a production backend URL (different from preview or dev)

Recommended pattern

- Create two Vercel projects (optional but recommended):
  - educard-web-dev (connected to the repo, default Preview + branch deploys)
  - educard-web-prod (connected to the same repo, Production Branch = `main`)

Steps (console)

1. Create a new Vercel project: "Import Project" -> connect the same Git repo.
   - When asked for Production Branch, set `main`.
   - If you already have an existing Vercel project that deploys previews, create a separate project for production (this keeps domains and envs separate).

2. Add production environment variables in the Vercel Project settings (for `educard-web-prod`):
   - VITE_API_BASE_URL = https://<your-production-backend-domain>/api
   - VITE_APP_ENVIRONMENT = production
   - VITE_ENABLE_ANALYTICS = true
   - Any other VITE\_\* keys used by the app (see `apps/web/.env.production` for examples)

   Notes:
   - Vite exposes variables prefixed with `VITE_` to the client (import.meta.env.VITE\_\*). Double-check the variable names used in `apps/web/src/constants/app-config.ts` and `.env.production`.
   - You can scope each variable to Production only (Vercel UI lets you add them to Production, Preview or Development).

3. If you need to set secrets via the CLI, use the Vercel CLI (example):
   - Install/authorize: `npm i -g vercel` and `vercel login`
   - Add production env (example):
     ```bash
     vercel env add VITE_API_BASE_URL production
     # then paste the value like: https://educard-backend-api-272236662775.asia-south1.run.app/api
     ```

4. Confirm Project > Settings > Git has `Production Branch` set to `main`. This ensures only pushes to `main` create production deployments.

5. Domains & Aliasing
   - Attach your production domain (e.g., `app.educard.example`) to the `educard-web-prod` project under Domains. Add any DNS records requested by Vercel.
   - Keep preview deployments separate (they will be on vercel.app preview URLs).

6. Backend configuration for mobile and CI
   - The mobile app `apps/mobile/.env.production` uses `API_URL` — ensure your mobile build pipeline (APK/EAS) reads the desired production API URL.
   - GitHub Actions config in this repo already refers to `VITE_API_BASE_URL_PROD` / `VITE_API_BASE_URL_DEV` secrets in CI workflows; when you use Vercel auto-deploy you only need to set Vercel env variables. If you still run CI that builds web bundles, keep CI secrets in GitHub and sync values.

Variable mapping cheat-sheet (common names in this repo)

- Web (Vite):
  - VITE_API_BASE_URL (general, used at runtime; but you can set environment-specific: VITE_API_BASE_URL_PROD / VITE_API_BASE_URL_DEV)
  - VITE_APP_ENVIRONMENT
  - VITE_ENABLE_ANALYTICS

- Mobile / APK builds:
  - MOBILE_API_URL_DEV (used in CI to bake API into dev APK)
  - API_URL (apps/mobile/.env.production)

How branch routing works (practical notes)

- Vercel project A (dev) can have Production Branch = `development` or left unset (previews only). Project B (prod) should set Production Branch = `main`.
- When you push a PR, Vercel will create a preview deployment in the dev project. When you merge to `main`, Vercel will create a production deployment in the prod project.

Troubleshooting

- Wrong backend on production site: check Project > Settings > Environment Variables for the prod project and ensure `VITE_API_BASE_URL` (or your chosen key) points to the intended backend.
- Preview still hits production backend: ensure preview env variables do not accidentally match production values; set Preview/Development variables separately in the dev project.
- CI builds vs Vercel builds: If you use GitHub Actions to build and then upload static assets to a CDN/hosting, the CI needs the same env var names as Vercel or you should normalize names in the pipeline.

Minimal checklist to hand off to ops/owner

- [ ] Create `educard-web-prod` project in Vercel and connect repo
- [ ] Set Production Branch to `main`
- [ ] Add `VITE_API_BASE_URL` (production backend URL) to Production envs
- [ ] Attach production domain
- [ ] Verify a merge to `main` triggers a production deployment

If you'd like, I can:

- Commit a tiny README with the exact environment variable list used by `apps/web` (I can add it to `educard-clients/docs`).
- Update CI workflow examples to reference `VITE_API_BASE_URL_PROD` consistently.

---

Useful references in this repo:

- `apps/web/.env.production` (examples of Vite production env vars)
- `docs/DEPLOYMENT_GUIDE.md` (general Vercel / deploy notes)
