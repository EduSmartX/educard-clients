module.exports = {
  presets: [
    ['@react-native/babel-preset', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
  plugins: [
    'react-native-worklets/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
