const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root and shared package
const monorepoRoot = path.resolve(__dirname, '../..');
const sharedPackage = path.resolve(monorepoRoot, 'packages/shared');

const config = getDefaultConfig(__dirname);

// 1. Set the project root to this app (not the monorepo root)
config.projectRoot = __dirname;

// 2. Watch the shared package and monorepo root for changes
config.watchFolders = [sharedPackage, monorepoRoot];

// 3. Ensure all modules resolve from the mobile app's node_modules FIRST,
//    then fall back to the monorepo root's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 4. Force critical packages to resolve from the app's copy
//    (prevents duplicate React instances & pnpm symlink issues)
//    Also shim native modules that crash in Expo Go with TurboModule errors
const shimMap = {
  'react-native-reanimated': path.resolve(__dirname, 'src/lib/animated-shim.tsx'),
  'lucide-react-native': path.resolve(__dirname, 'src/lib/lucide-shim.tsx'),
  'expo-linear-gradient': path.resolve(__dirname, 'src/lib/linear-gradient-shim.tsx'),
};

config.resolver.extraNodeModules = new Proxy(
  {
    react: path.resolve(__dirname, 'node_modules/react'),
    'react-native': path.resolve(__dirname, 'node_modules/react-native'),
    'expo-router': path.resolve(__dirname, 'node_modules/expo-router'),
    '@expo/metro-runtime': path.resolve(__dirname, 'node_modules/@expo/metro-runtime'),
  },
  {
    // For any module not explicitly listed, try the app's node_modules first
    get: (target, name) => target[name] || path.resolve(__dirname, 'node_modules', name),
  }
);

// Intercept resolution for shimmed modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (shimMap[moduleName]) {
    return {
      filePath: shimMap[moduleName],
      type: 'sourceFile',
    };
  }
  // Fall back to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

// 5. Follow symlinks (needed for pnpm)
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
