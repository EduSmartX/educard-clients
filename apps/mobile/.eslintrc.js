module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // `void promise` is the idiomatic TanStack Query fire-and-forget pattern used across hooks.
    'no-void': 'off',
  },
};
