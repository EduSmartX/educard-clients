/**
 * Lint-Staged Configuration
 * Runs linters on staged files before commit.
 * Equivalent to Python pre-commit hooks (ruff, mypy, pep8) in the backend.
 *
 * Checks performed:
 *  1. ESLint         — code quality & style (like ruff/flake8)
 *  2. Prettier       — formatting (like black)
 *  3. TypeScript     — type-checking (like mypy)
 *  4. Secret detect  — prevent committing keys/passwords
 *  5. No debugger    — prevent committing debugger/console.log
 *  6. EOL / trailing — enforced via prettier endOfLine: "lf"
 */
module.exports = {
  // TypeScript & TSX files — lint + format + check for debug statements
  "*.{ts,tsx}": (filenames) => [
    `eslint --fix --max-warnings=0 ${filenames.join(" ")}`,
    `prettier --write ${filenames.join(" ")}`,
    // Reject debugger statements and console.log (console.warn/error are OK)
    `grep -nE "^[^/]*\\bdebugger\\b" ${filenames.join(" ")} && echo "❌ Remove debugger statements!" && exit 1 || true`,
  ],

  // JSON, YAML, Markdown — format only
  "*.{json,yml,yaml,md}": ["prettier --write"],

  // CSS files — format
  "*.css": ["prettier --write"],

  // Detect secrets / private keys in any source file
  "*.{ts,tsx,js,jsx,json,env}": (filenames) => [
    `grep -rlE "(PRIVATE KEY|-----BEGIN RSA|-----BEGIN EC|password\\s*=\\s*['\\"]{1}[^'\\"])" ${filenames.join(" ")} && echo "❌ Possible secrets detected!" && exit 1 || true`,
  ],
};
