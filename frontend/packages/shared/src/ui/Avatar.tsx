import React from 'react';
import { Image, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';

export function Avatar({ name, uri, size = 44 }: { name?: string | null; uri?: string | null; size?: number }) {
  const t = useTheme();
  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text weight="800" color={t.colors.accent} style={{ fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </View>
  );
}
