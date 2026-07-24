const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * Notifee ships its native `core` AAR inside the npm package
 * (@notifee/react-native/android/libs), not on a public Maven repo. Its own
 * build.gradle registers that repo, but modern Gradle ignores repositories
 * declared in project build.gradle files, and in this npm-workspaces monorepo
 * node_modules is hoisted to `frontend/`. So register the repo — resolved through
 * Node, so it holds under any hoisting layout — in the root build.gradle's
 * allprojects.repositories, where Gradle actually looks.
 */
const REPO = `
        // Notifee's native core AAR (bundled in the npm package).
        maven {
            url new File(
                providers.exec {
                    workingDir(rootDir)
                    commandLine("node", "--print", "require.resolve('@notifee/react-native/package.json')")
                }.standardOutput.asText.get().trim()
            ).getParentFile().absolutePath + "/android/libs"
        }`;

module.exports = function withNotifeeRepo(config) {
  return withProjectBuildGradle(config, (cfg) => {
    const contents = cfg.modResults.contents;
    if (contents.includes("require.resolve('@notifee/react-native")) return cfg; // already added
    cfg.modResults.contents = contents.replace(
      /allprojects\s*\{\s*repositories\s*\{/,
      (match) => `${match}${REPO}`,
    );
    return cfg;
  });
};
