module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:jest-)?(?:@react-native|react-native|@react-navigation|react-native-reanimated|react-native-worklets|nativewind|react-native-css-interop|react-native-gesture-handler|react-native-vector-icons|lucide-react-native|react-native-keyboard-aware-scroll-view|react-native-linear-gradient)/)',
  ],
};
