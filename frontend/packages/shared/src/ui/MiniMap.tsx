import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from '../theme';

/**
 * Stylised street map (chamafacil MiniMap) — decorative grid + dashed accent route
 * with a teardrop "me" pin and a moving green puck. Matches the hi-fi mockups
 * (the real map uses react-native-maps elsewhere).
 */
export function MiniMap({
  height = 200,
  route = true,
  puck = true,
  radius = 16,
  style,
}: {
  height?: number;
  route?: boolean;
  puck?: boolean;
  radius?: number;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const ink = t.colors.ink;
  return (
    <View style={[{ height, borderRadius: radius, overflow: 'hidden', backgroundColor: t.dark ? '#0e141d' : t.colors.surface2 }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 390 240" preserveAspectRatio="xMidYMid slice">
        <G stroke={ink} strokeWidth={10} opacity={0.06} fill="none" strokeLinecap="round">
          <Path d="M-20 60H410M-20 150H410M-20 215H410" />
          <Path d="M70 -20V260M180 -20V260M300 -20V260" />
        </G>
        <G stroke={ink} strokeWidth={4} opacity={0.05} fill="none">
          <Path d="M-20 105H410M120 -20V260M250 -20V260" />
        </G>
        {route && (
          <Path
            d="M95 188 C 140 188, 150 120, 200 110 S 270 70, 300 64"
            fill="none"
            stroke={t.colors.accent}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray="1 11"
            opacity={0.85}
          />
        )}
      </Svg>

      {/* "me" teardrop pin at ~24%,82% */}
      <View style={{ position: 'absolute', left: '24%', top: '82%', marginLeft: -9, marginTop: -18 }}>
        <View
          style={{
            width: 18,
            height: 18,
            backgroundColor: t.colors.accent,
            borderWidth: 3,
            borderColor: '#fff',
            borderTopLeftRadius: 9,
            borderTopRightRadius: 9,
            borderBottomLeftRadius: 9,
            borderBottomRightRadius: 0,
            transform: [{ rotate: '-45deg' }],
            ...t.shadowSm,
          }}
        />
      </View>

      {/* moving green puck at ~77%,27% */}
      {puck && (
        <View style={{ position: 'absolute', left: '77%', top: '27%', marginLeft: -11, marginTop: -11 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: t.colors.ok, borderWidth: 4, borderColor: '#fff', shadowColor: t.colors.ok, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 }} />
        </View>
      )}
    </View>
  );
}
