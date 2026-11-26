// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The offline reader pages (assets/reader/*.html) are bundled as assets.
config.resolver.assetExts.push('html');

module.exports = config;
