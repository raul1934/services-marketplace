import React from 'react';
import { View } from 'react-native';
import { Text } from '../Text';
import { useTheme } from '../../theme';
// Official Chama Fácil mark from the landing page (multi-hue flame + white ribbon),
// imported as a component via react-native-svg-transformer. The flame keeps its
// own brand colors; the wordmark text takes the theme accent (or white on
// gradients). The purple variant is the same mark hue-shifted for the provider's
// theme (provider); other themes keep the original orange.
import ChamaLogo from '../../../../../assets/chamafacil-logo.svg';
import ChamaLogoPurple from '../../../../../assets/chamafacil-logo-purple.svg';

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
  const Logo = t.name === 'provider' ? ChamaLogoPurple : ChamaLogo;
  return (
    // One element carrying the brand name, rather than the SVG and the wordmark
    // announced as two separate stops that say the same thing. The name is not
    // translated on purpose — it is a brand, not copy.
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Chama Fácil"
      style={{ flexDirection: 'row', alignItems: 'center', gap: height * 0.32 }}
    >
      <Logo width={height * LOGO_RATIO} height={height} />
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
