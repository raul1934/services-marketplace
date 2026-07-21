import React from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { focusRing } from '../../lib/a11y';
import { Text } from '../Text';
import GoogleMark from '../../../../../icons/google.svg';

/**
 * Google sign-in button (chamafacil .gbtn).
 *
 * Only render it when Google sign-in is actually available
 * (`useGoogleSignIn().available`) — offering it without a configured
 * webClientId is a dead end that can only end in an error.
 */
export function GoogleButton({ label, onPress, loading, disabled }: { label: string; onPress?: () => void; loading?: boolean; disabled?: boolean }) {
  const t = useTheme();
  // A button with no handler is inert; report it as disabled instead of
  // letting screen readers announce a tappable control that does nothing.
  const isDisabled = disabled || loading || !onPress;
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ focused }: any) => [
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, padding: 14, borderRadius: t.radius.btn, borderWidth: 1.5, borderColor: t.colors.line, backgroundColor: t.dark ? t.colors.surface2 : t.colors.surface, opacity: isDisabled ? 0.6 : 1 },
        focusRing(t.colors.accent, focused),
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={t.colors.ink} /> : <GoogleMark width={20} height={20} />}
      <Text weight="700" style={{ fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}
