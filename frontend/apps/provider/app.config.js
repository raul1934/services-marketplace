// Extends app.json with localized native iOS permission strings (pt + en),
// sourced from ../../config/permissions.js — no inline permission text here.
const withLocalizedPermissions = require('../../config/with-localized-permissions');
const permissions = require('../../config/permissions');

// Google Maps native key comes from the app's .env (gitignored) so it's not
// committed; expo prebuild bakes it into the Android manifest / iOS Info.plist.
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    config: { ...config.ios?.config, googleMapsApiKey },
  },
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: { ...config.android?.config?.googleMaps, apiKey: googleMapsApiKey },
    },
  },
  plugins: [
    ...(config.plugins || []),
    '@react-native-google-signin/google-signin',
    [
      withLocalizedPermissions,
      { strings: permissions.provider, locales: permissions.locales, defaultLocale: permissions.defaultLocale },
    ],
  ],
});
