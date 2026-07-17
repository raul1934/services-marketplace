// Type for `import GoogleMark from '.../icons/google.svg'`.
// See assets/chamafacil-logo.d.svg.ts for why these are per-file declarations
// rather than a blanket `declare module '*.svg'`.
import type * as React from 'react';
import type { SvgProps } from 'react-native-svg';

declare const GoogleMark: React.FC<SvgProps>;
export default GoogleMark;
