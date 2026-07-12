import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';

/** "or" divider with rules (chamafacil .divider-or). */
export function DividerOr({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: t.colors.line }} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: t.colors.ink3 }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: t.colors.line }} />
    </View>
  );
}
