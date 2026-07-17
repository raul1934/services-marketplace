// Type for `import ChamaLogo from '.../chamafacil-logo.svg'`.
//
// Metro turns .svg into a React component via react-native-svg-transformer
// (svgr with `native: true`), which spreads props onto react-native-svg's <Svg>
// — so SvgProps is the accurate prop type, and it already includes `color`.
//
// This is a per-file `.d.svg.ts` (resolved by `allowArbitraryExtensions`) rather
// than a blanket `declare module '*.svg'` on purpose: a wildcard matches ANY
// specifier ending in .svg, so a deleted or renamed asset would silently keep
// type-checking. Here the declaration is tied to this one file, so a bad import
// path still fails with TS2307. Keep this file next to the .svg it describes.
import type * as React from 'react';
import type { SvgProps } from 'react-native-svg';

declare const ChamaFacilLogo: React.FC<SvgProps>;
export default ChamaFacilLogo;
