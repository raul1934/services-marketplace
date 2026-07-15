import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { Screen } from './Screen';

/**
 * Shimmer placeholder block. Pulses opacity (native driver) so it works without
 * reanimated. Theme-aware: uses the line color, visible in light and dark mode.
 */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 8,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: t.colors.line, opacity: op }, style]} />;
}

/** Card-shaped placeholder: avatar + two text lines + a wide line. */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.colors.surface, borderRadius: t.radius.card, padding: 18, borderWidth: 1, borderColor: t.colors.line },
        t.dark ? null : t.shadowSm,
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Skeleton width={52} height={52} radius={16} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="62%" height={15} />
          <Skeleton width="38%" height={12} />
        </View>
      </View>
      <View style={{ height: 16 }} />
      <Skeleton width="100%" height={12} />
    </View>
  );
}

/** Vertical list of card placeholders — drop-in for a list's loading state. */
export function SkeletonList({ count = 4, padded = true }: { count?: number; padded?: boolean }) {
  return (
    <View style={{ gap: 14, paddingHorizontal: padded ? 20 : 0, paddingTop: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

/** Row of square tile placeholders — for category / quick-action grids. */
export function SkeletonTiles({ count = 4 }: { count?: number }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: `${Math.floor(92 / count)}%`, alignItems: 'center', gap: 8 }}>
          <Skeleton width={60} height={60} radius={18} />
          <Skeleton width="80%" height={11} />
        </View>
      ))}
    </View>
  );
}

/** Full-screen placeholder for detail screens: a header row + a few cards. */
export function SkeletonScreen() {
  return (
    <Screen stickyHeader scroll={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Skeleton width={38} height={38} radius={19} />
          <Skeleton width="48%" height={20} />
        </View>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    </Screen>
  );
}
