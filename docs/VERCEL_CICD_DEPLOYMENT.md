# Vercel CI/CD Deployment Setup

This document explains how frontend deployments are handled through GitHub Actions and Vercel, with branch-based routing for development and production.

## Goal

- Deploy Development from development branches.
- Deploy Production from main branches.
- Do not block deployment if tests, lint, or type checks are incomplete or failing.

## Workflow Added

GitHub Actions workflow file:

- .github/workflows/vercel-deploy.yml

## Branch to Environment Mapping

- develop or development branch -> Vercel Development project
- main or master branch -> Vercel Production project

## Non-Blocking Deployment Behavior

The workflow has an Optional Prechecks job that runs lint and type checks with non-blocking behavior.

- Prechecks job is marked continue-on-error.
- Deploy jobs use always() in their condition.
- Result: deployment continues even if prechecks fail.

## Required GitHub Secrets

Add these repository secrets in GitHub:

1. VERCEL_TOKEN
2. VERCEL_ORG_ID
3. VERCEL_PROJECT_ID_DEV
4. VERCEL_PROJECT_ID_PROD

## How to Get Secret Values

### VERCEL_TOKEN

- Open Vercel Account Settings.
- Go to Tokens.
- Create a token and copy it.
- Save it as VERCEL_TOKEN in GitHub secrets.

### VERCEL_ORG_ID and VERCEL_PROJECT_ID

Option A: From Vercel project settings

- Open the project in Vercel.
- Go to Settings.
- Copy Organization ID and Project ID.

Option B: From local linked project

- Run Vercel link for each project context.
- Read values from .vercel/project.json.

Use the Development project ID for VERCEL_PROJECT_ID_DEV and the Production project ID for VERCEL_PROJECT_ID_PROD.

## Vercel Project Structure Recommendation

Use two separate Vercel projects:

- edu-card-web-dev (for develop/development)
- edu-card-web-prod (for main/master)

This keeps environments isolated and allows different environment variables if needed.

## CI/CD Trigger Rules

The workflow runs on:

- push to develop
- push to development
- push to main
- push to master
- manual workflow_dispatch

## Deployment Flow Summary

1. Prechecks run (non-blocking).
2. If branch is develop/development, deploy to Development project.
3. If branch is main/master, deploy to Production project.

## Important Configuration

The repository vercel.json has git deployment disabled:

- git.deploymentEnabled is false

This ensures deployments are controlled by GitHub Actions CI/CD only and avoids duplicate Vercel auto-deploys.

## Environment Variables

Set app environment variables inside each Vercel project:

- Development values in the Dev Vercel project
- Production values in the Prod Vercel project

Because the workflow uses vercel pull and vercel build for each project, those environment values are applied at build/deploy time.

## Validation Checklist

After setup, verify:

1. GitHub secrets are added correctly.
2. Push to develop triggers Dev deployment.
3. Push to main triggers Prod deployment.
4. A failing precheck still allows deployment to continue.
5. Vercel shows deployments in the expected project.

## Rollback

To rollback quickly:

- Use Vercel dashboard and promote a previous healthy deployment.
- Or re-run workflow from a known good commit.

## Notes

- Existing CI workflow can continue to run for quality visibility.
- This deployment workflow is intentionally tolerant to precheck failures, based on release policy.
