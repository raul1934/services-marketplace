import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';
import GoogleMark from '../../../../../icons/google.svg';

/** Google sign-in button (chamafacil .gbtn). */
export function GoogleButton({ label, onPress, loading }: { label: string; onPress?: () => void; loading?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, padding: 14, borderRadius: t.radius.btn, borderWidth: 1.5, borderColor: t.colors.line, backgroundColor: t.dark ? t.colors.surface2 : t.colors.surface, opacity: loading ? 0.6 : 1 }}
    >
      {loading ? <ActivityIndicator size="small" color={t.colors.ink} /> : <GoogleMark width={20} height={20} />}
      <Text weight="700" style={{ fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}
