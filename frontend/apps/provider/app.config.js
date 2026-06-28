// Extends app.json with localized native iOS permission strings (pt + en),
// sourced from ../../config/permissions.js — no inline permission text here.
const withLocalizedPermissions = require('../../config/with-localized-permissions');
const permissions = require('../../config/permissions');

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    [
      withLocalizedPermissions,
      { strings: permissions.provider, locales: permissions.locales, defaultLocale: permissions.defaultLocale },
    ],
  ],
});
