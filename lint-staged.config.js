/**
 * Lint-Staged Configuration
 * Runs linters on staged files before commit.
 * Equivalent to Python pre-commit hooks (ruff, mypy, pep8) in the backend.
 *
 * Checks performed:
 *  1. ESLint         — code quality & style (like ruff/flake8)
 *  2. Prettier       — formatting (like black)
 *  6. EOL / trailing — enforced via prettier endOfLine: "lf"
 * 
 * Note: ESLint is run per-app to handle monorepo path resolution correctly.
 *       Running from root causes import resolution issues.
 */
module.exports = {
  // TypeScript & TSX files — format only (lint is handled by husky from app dir)
  "*.{ts,tsx}": ["prettier --write"],

  // JSON, YAML, Markdown — format only
  "*.{json,yml,yaml,md}": ["prettier --write"],

  // CSS files — format
  "*.css": ["prettier --write"],
};
