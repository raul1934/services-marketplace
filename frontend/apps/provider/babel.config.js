module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved the worklet transform into react-native-worklets;
    // 'react-native-reanimated/plugin' is now just a re-export shim.
    plugins: ['react-native-worklets/plugin'],
  };
};
