// babel-preset-expo already adds the react-native-worklets plugin that
// Reanimated 4 needs. Do NOT add react-native-reanimated/plugin or
// react-native-worklets/plugin here too: registering it twice breaks the build.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
