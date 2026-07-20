/**
 * Lint-Staged Configuration
 * Runs prettier on staged files. Full ESLint/tsc runs in CI pipeline.
 */
module.exports = {
  // TypeScript & TSX files: format only
  "*.{ts,tsx}": ["prettier --write"],

  // JSON, YAML, Markdown — format only
  "*.{json,yml,yaml,md}": ["prettier --write"],

  // CSS files — format
  "*.css": ["prettier --write"],
};
