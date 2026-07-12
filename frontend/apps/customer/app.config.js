// Extends app.json with localized native iOS permission strings (pt + en),
// sourced from ../../config/permissions.js — no inline permission text here.
const withLocalizedPermissions = require('../../config/with-localized-permissions');
const permissions = require('../../config/permissions');

// Maps use Leaflet + OpenStreetMap (react-native-maps aliased to a Leaflet
// WebView, see metro.config.js) — no Google Maps key / native config needed.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    '@react-native-google-signin/google-signin',
    [
      withLocalizedPermissions,
      { strings: permissions.customer, locales: permissions.locales, defaultLocale: permissions.defaultLocale },
    ],
  ],
});
