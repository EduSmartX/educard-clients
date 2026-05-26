module.exports = function appConfig({ config }) {
  return {
    ...config,
    android: {
      ...config.android,
      package: 'com.educard.app',
    },
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.educard.app',
    },
  };
};
