/**
 * Commitlint Configuration
 * Enforces Conventional Commits format:
 *   type(scope): description
 *
 * Examples:
 *   feat(mobile): add teacher edit screen
 *   fix(shared): correct API endpoint path
 *   refactor(mobile): extract list header component
 *   chore: update dependencies
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // type must be one of:
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation only
        "style", // Formatting, missing semicolons, etc.
        "refactor", // Code change that neither fixes a bug nor adds a feature
        "perf", // Performance improvement
        "test", // Adding or updating tests
        "build", // Build system or external dependencies
        "ci", // CI configuration
        "chore", // Maintenance tasks
        "revert", // Revert a previous commit
      ],
    ],
    // scope is optional but when used, must be lowercase
    "scope-case": [2, "always", "lower-case"],
    // subject must not be empty
    "subject-empty": [2, "never"],
    // subject must be lowercase
    "subject-case": [2, "always", "lower-case"],
    // subject max length
    "subject-max-length": [2, "always", 100],
    // no period at end
    "subject-full-stop": [2, "never", "."],
    // body max line length
    "body-max-line-length": [1, "always", 200],
  },
};
