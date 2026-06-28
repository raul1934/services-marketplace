import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '../theme';
import { focusRing } from '../lib/a11y';
import { Text } from './Text';

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ hovered, focused }: any) => [
        {
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 999,
          backgroundColor: active ? t.colors.accent : t.colors.surface,
          borderWidth: 1,
          borderColor: active ? t.colors.accent : t.colors.line,
        },
        hovered && !active ? { backgroundColor: t.colors.surface2 } : null,
        focusRing(t.colors.accent, focused),
      ]}
    >
      <Text variant="label" color={active ? t.colors.accentInk : t.colors.ink2}>
        {label}
      </Text>
    </Pressable>
  );
}
