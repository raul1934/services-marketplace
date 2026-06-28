import React from 'react';
import { Image } from 'react-native';
import { useTheme } from '../../theme';

// Official Walvee wordmark (dolphins + "walvee"). The asset is a single-hue
// mark on transparent bg, so we tint it to the theme accent — matching how the
// landing page renders the logo. Pass `onAccent` for white (on gradient bgs).
const MARK = require('../../../../../assets/walvee-mark.png');
const RATIO = 773 / 196;

export function BrandMark({
  height = 26,
  color,
  onAccent,
}: {
  height?: number;
  color?: string;
  onAccent?: boolean;
}) {
  const t = useTheme();
  const tintColor = onAccent ? '#ffffff' : color ?? t.colors.accent;
  return (
    <Image
      source={MARK}
      resizeMode="contain"
      style={{ height, width: height * RATIO, tintColor }}
    />
  );
}
