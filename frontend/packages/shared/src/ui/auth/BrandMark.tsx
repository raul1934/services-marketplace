import React from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
// Official Chama Fácil mark from the landing page (multi-hue flame + white ribbon),
// imported as a component via react-native-svg-transformer. It keeps its own brand
// colors; only the wordmark text takes the theme accent (or white on gradients).
import ChamaLogo from '../../../../../assets/chamafacil-logo.svg';

const LOGO_RATIO = 610 / 870;

export function BrandMark({
  height = 28,
  color,
  onAccent,
}: {
  height?: number;
  color?: string;
  onAccent?: boolean;
}) {
  const t = useTheme();
  const textColor = onAccent ? '#ffffff' : color ?? t.colors.accent;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: height * 0.32 }}>
      <ChamaLogo width={height * LOGO_RATIO} height={height} />
      <Text
        style={{
          fontFamily: 'Manrope_800ExtraBold',
          fontSize: height * 0.82,
          lineHeight: height * 1.15,
          letterSpacing: -0.5,
          color: textColor,
        }}
      >
        Chama Fácil
      </Text>
    </View>
  );
}
