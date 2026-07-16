const { withSettingsGradle } = require('expo/config-plugins');

/**
 * ViroReact's own config plugin hard-codes its Gradle module paths as
 * `../node_modules/@reactvision/react-viro/android/*`, which only resolves when
 * node_modules sits next to `android/`. This is an npm-workspaces monorepo, so the
 * package is hoisted to `frontend/node_modules` and Gradle fails at configuration
 * time with "Configuring project ':gvr_common' without an existing directory".
 *
 * Resolve the package through Node instead — the same `providers.exec` +
 * `require.resolve` pattern Expo/React Native already use in this file — so the
 * paths hold under any hoisting layout.
 *
 * NOTE: register this BEFORE "@reactvision/react-viro" in app.json. Expo composes
 * mods so the last-registered runs first; listing this one earlier makes it run
 * *after* Viro's mod has appended the lines we rewrite.
 */
const RESOLVER = `
def viroAndroidDir = new File(
  providers.exec {
    workingDir(rootDir)
    commandLine("node", "--print", "require.resolve('@reactvision/react-viro/package.json')")
  }.standardOutput.asText.get().trim()
).getParentFile().absolutePath + "/android"
`;

const HARDCODED = /new File\('\.\.\/node_modules\/@reactvision\/react-viro\/android\/([a-z_]+)'\)/g;

module.exports = function withViroMonorepoPaths(config) {
  return withSettingsGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!HARDCODED.test(contents)) return cfg; // Viro plugin absent or already fixed
    HARDCODED.lastIndex = 0;

    // Define the resolver right before the first Viro project(...) assignment.
    contents = contents.replace(/(include ':react_viro'[^\n]*\n)/, `$1${RESOLVER}`);
    contents = contents.replace(HARDCODED, 'new File(viroAndroidDir, "$1")');

    cfg.modResults.contents = contents;
    return cfg;
  });
};
