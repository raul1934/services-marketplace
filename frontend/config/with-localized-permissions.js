/**
 * Expo config plugin: localizes iOS permission usage descriptions.
 *
 *  - sets the default-locale strings directly in Info.plist
 *  - registers CFBundleLocalizations / CFBundleDevelopmentRegion
 *  - writes a <locale>.lproj/InfoPlist.strings file per locale so iOS shows the
 *    permission prompt in the device language
 *
 * Runs at `expo prebuild` / native build (no effect on web).
 */
const { withInfoPlist, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const esc = (s) => s.replace(/"/g, '\\"');

module.exports = function withLocalizedPermissions(config, { strings, locales, defaultLocale }) {
  // 1) default strings + supported localizations in Info.plist
  config = withInfoPlist(config, (cfg) => {
    for (const [key, byLocale] of Object.entries(strings)) {
      cfg.modResults[key] = byLocale[defaultLocale];
    }
    cfg.modResults.CFBundleLocalizations = locales;
    cfg.modResults.CFBundleDevelopmentRegion = defaultLocale;
    return cfg;
  });

  // 2) per-locale InfoPlist.strings
  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const appDir = path.join(cfg.modRequest.platformProjectRoot, cfg.modRequest.projectName);
      for (const locale of locales) {
        const dir = path.join(appDir, `${locale}.lproj`);
        fs.mkdirSync(dir, { recursive: true });
        const body = Object.entries(strings)
          .map(([key, byLocale]) => `"${key}" = "${esc(byLocale[locale] || byLocale[defaultLocale])}";`)
          .join('\n');
        fs.writeFileSync(path.join(dir, 'InfoPlist.strings'), body + '\n', 'utf8');
      }
      return cfg;
    },
  ]);

  return config;
};
