import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';

/** Read-only or interactive 5-star rating. */
export function Stars({
  value,
  size = 18,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', gap: 4 }}
      accessible
      accessibilityRole={onChange ? 'adjustable' : 'image'}
      accessibilityLabel={`${Math.round(value * 10) / 10} / 5`}
      accessibilityValue={onChange ? { min: 1, max: 5, now: Math.round(value) } : undefined}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = (
          <Text style={{ fontSize: size, color: filled ? t.colors.warn : t.colors.line }}>★</Text>
        );
        return onChange ? (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={6}>
            {star}
          </Pressable>
        ) : (
          <View key={i}>{star}</View>
        );
      })}
    </View>
  );
}
