const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const sharedPackage = path.resolve(workspaceRoot, 'packages/shared');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [sharedPackage, workspaceRoot];

config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, 'node_modules'),
	path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = new Proxy(
	{
		react: path.resolve(projectRoot, 'node_modules/react'),
	'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
	},
	{
		get: (target, name) => target[name] || path.resolve(projectRoot, 'node_modules', String(name)),
	}
);

config.resolver.unstable_enableSymlinks = true;

// Use blockList directly without exclusionList wrapper
config.resolver.blockList = [
	new RegExp(`${path.resolve(workspaceRoot, 'apps/mobile-expo')}/.*`),
];

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = withNativeWind(config, { input: './global.css' });
