// Metro config for an Expo app inside an npm-workspaces monorepo.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Import .svg files as React components (no inline SVG markup) — consumes the
// generated assets in frontend/icons via react-native-svg-transformer.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((e) => e !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Watch the whole workspace so changes in packages/shared hot-reload.
config.watchFolders = [workspaceRoot];

// Resolve modules from the app first, then the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// We don't use Google Maps. `react-native-maps` is aliased to Leaflet on every
// platform: the DOM stub on web, and a Leaflet-in-WebView impl on native
// (packages/shared/src/maps). Both expose the same MapView/Marker/Polygon/Polyline.
const mapsWebStub = path.resolve(projectRoot, 'src/web-stubs/react-native-maps.tsx');
const mapsNative = path.resolve(workspaceRoot, 'packages/shared/src/maps/react-native-maps.tsx');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-maps') {
    return { type: 'sourceFile', filePath: platform === 'web' ? mapsWebStub : mapsNative };
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
