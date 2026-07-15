import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import Constants from 'expo-constants';
import { Text, useTheme } from '@chamafacil/shared';
import ChamaLogo from '../../../../assets/chamafacil-logo.svg';

const LOGO_RATIO = 610 / 870;

/**
 * Branded splash / loading screen: the Chama Fácil mark, the app name, and the
 * current version underneath. Shown while auth state resolves at startup, right
 * after the native splash image.
 */
export function SplashBrand() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const logoH = 104;
  // The native splash background is white, so the text is fixed dark (readable in
  // both light and dark mode, since the splash itself stays light).
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', gap: 20 }}>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <ChamaLogo width={logoH * LOGO_RATIO} height={logoH} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: 'Manrope_800ExtraBold', fontSize: 30, lineHeight: 40, letterSpacing: -0.6, color: '#15233b' }}>
            Chama Fácil
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#95a2b6' }}>versão {version}</Text>
        </View>
      </View>
      <ActivityIndicator color="#ff6a3d" style={{ marginTop: 6 }} />
    </View>
  );
}
