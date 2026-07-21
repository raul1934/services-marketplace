import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { focusRing } from '../lib/a11y';
import { Text } from './Text';

export type ButtonVariant = 'grad' | 'solid' | 'ghost' | 'soft' | 'ok' | 'danger';
export type ButtonSize = 'md' | 'sm' | 'lg';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: ViewStyle;
  /** Announce a segmented/toggle button's on state to screen readers. */
  selected?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'grad',
  size = 'md',
  disabled,
  loading,
  full,
  left,
  right,
  style,
  selected,
}: Props) {
  const t = useTheme();
  const height = size === 'lg' ? 56 : size === 'sm' ? 38 : 50;
  const padH = size === 'sm' ? 16 : 22;
  const fontSize = size === 'sm' ? 14 : 16;
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    grad: { bg: 'transparent', fg: t.colors.accentInk },
    solid: { bg: t.colors.ink, fg: t.colors.surface },
    ghost: { bg: 'transparent', fg: t.colors.ink, border: t.colors.line },
    soft: { bg: t.colors.accentSoft, fg: t.colors.accent },
    ok: { bg: t.colors.ok, fg: '#fff' },
    danger: { bg: t.colors.dangerSoft, fg: t.colors.danger },
  };
  const p = palette[variant];

  const inner = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {left}
          <Text weight="700" color={p.fg} style={{ fontSize }}>
            {title}
          </Text>
          {right}
        </>
      )}
    </View>
  );

  const shell: ViewStyle = {
    height,
    paddingHorizontal: padH,
    borderRadius: t.radius.btn,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: full ? 'stretch' : 'flex-start',
    opacity: isDisabled ? 0.5 : 1,
  };

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, selected }}
      style={({ pressed, hovered, focused }: any) => [
        { transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }] },
        hovered && !isDisabled ? { opacity: 0.92 } : null,
        focusRing(t.colors.accent, focused),
        full && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {variant === 'grad' ? (
        <LinearGradient
          colors={t.grad as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[shell, t.shadowSm]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={[shell, { backgroundColor: p.bg, borderWidth: p.border ? 1.5 : 0, borderColor: p.border }]}>
          {inner}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
