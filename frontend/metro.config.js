const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Support .mjs files for lucide-react-native
config.resolver.sourceExts.push('mjs');

module.exports = withNativeWind(config, { input: "./src/global.css" });
