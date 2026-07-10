/**
 * Lint-Staged Configuration
 * Runs prettier + eslint on staged files only (not the whole project).
 */
module.exports = {
  // Web app: prettier + eslint on staged ts/tsx files
  "apps/web/**/*.{ts,tsx}": [
    "prettier --write",
    "eslint --max-warnings=0 --no-warn-ignored",
  ],

  // Mobile app: prettier + eslint on staged ts/tsx files
  "apps/mobile/**/*.{ts,tsx}": [
    "prettier --write",
    "eslint --max-warnings=0 --no-warn-ignored",
  ],

  // Shared package: prettier + eslint on staged ts files
  "packages/shared/**/*.ts": [
    "prettier --write",
    "eslint --max-warnings=0 --no-warn-ignored",
  ],

  // JSON, YAML, Markdown — format only
  "*.{json,yml,yaml,md}": ["prettier --write"],

  // CSS files — format
  "*.css": ["prettier --write"],
};
