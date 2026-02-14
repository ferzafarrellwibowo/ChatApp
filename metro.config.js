// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Firebase's @firebase/auth package uses a non-standard "rn" field
// (instead of "react-native") to point to its React Native entry.
// The RN entry calls registerAuth("ReactNative") which is required
// for initializeAuth() to work. Without this, Metro uses the "main"
// field which points to the Node.js entry (no RN auth registration).
config.resolver.resolverMainFields = [
  "react-native",
  "rn",        // ← needed for @firebase/auth
  "browser",
  "main",
];

module.exports = config;
