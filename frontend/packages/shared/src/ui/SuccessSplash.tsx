import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './Icon';

/**
 * Full-screen success confirmation: a green circle reveals outward from the
 * center until it fills the screen, then a check mark springs in. After a short
 * hold it calls `onDone`. Presentational only — the caller decides what's next.
 */
export function SuccessSplash({ onDone, holdMs = 1000 }: { onDone?: () => void; holdMs?: number }) {
  const t = useTheme();
  const { width, height } = Dimensions.get('window');
  // Diameter that reaches the far corners from the center (so the circle, scaled
  // to 1, fully covers the screen).
  const diameter = 2 * Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);

  const reveal = useRef(new Animated.Value(0)).current; // circle scale 0 → 1
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(reveal, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]),
      Animated.delay(holdMs),
    ]).start(() => onDone?.());
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1000 }]}>
      <Animated.View
        style={{
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: t.colors.ok,
          transform: [{ scale: reveal }],
        }}
      />
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        <Animated.View
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: 'rgba(255,255,255,0.22)',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: checkScale }],
            opacity: checkOpacity,
          }}
        >
          <Icon name="check" size={64} color="#fff" />
        </Animated.View>
      </View>
    </View>
  );
}
