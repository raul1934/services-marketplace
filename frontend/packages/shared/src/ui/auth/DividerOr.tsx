import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';

/**
 * "or" divider with rules (chamafacil .divider-or).
 *
 * Accessibility: read as one element, not three. The two rules are pure
 * decoration and are hidden; the word itself is kept, because it is what tells
 * a screen-reader user that the button below is an *alternative* to the one
 * above rather than the next step. Silencing it entirely would be tidier and
 * would lose that.
 */
export function DividerOr({ label }: { label: string }) {
  const t = useTheme();
  const rule = { flex: 1, height: 1, backgroundColor: t.colors.line } as const;
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={rule} accessibilityElementsHidden importantForAccessibility="no" />
      <Text style={{ fontSize: 12, fontWeight: '700', color: t.colors.ink3 }}>{label}</Text>
      <View style={rule} accessibilityElementsHidden importantForAccessibility="no" />
    </View>
  );
}
