// Learn more: https://docs.expo.dev/guides/customizing-metro
const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

/*
 * Since SDK 56, expo-router ships its own copy of React Navigation. Imports
 * written the classic way (`@react-navigation/native`) would fail to resolve,
 * or run a second navigation library that expo-router's navigators never see.
 * Point them at expo-router's copy: same API.
 */
const FORK = path.join(path.dirname(require.resolve("expo-router/package.json")), "build", "react-navigation");
const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstream || context.resolveRequest;
  const match = /^@react-navigation\/([a-z-]+)$/.exec(moduleName);
  if (match && fs.existsSync(path.join(FORK, match[1]))) {
    return resolve(context, `expo-router/build/react-navigation/${match[1]}`, platform);
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
