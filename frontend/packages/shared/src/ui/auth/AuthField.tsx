import React, { useState } from 'react';
import { Pressable, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';
import { Icon, IconName } from '../Icon';

/** Icon-prefixed text input with focus ring (chamafacil .input). */
export function AuthField({
  icon,
  prefix,
  error,
  label,
  revealLabel,
  hideLabel,
  ...rest
}: TextInputProps & {
  icon?: IconName;
  prefix?: string;
  error?: string;
  label?: string;
  /**
   * Accessible names for the show/hide-password button. Passing either one
   * turns the button on; a password field without them stays as it was.
   * Text comes from the caller — this package renders strings, it does not
   * author them.
   */
  revealLabel?: string;
  hideLabel?: string;
}) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  // Typing a password blind, on a phone keyboard, in the rain, is how people
  // get locked out of an app they are trying to call for help with.
  const [revealed, setRevealed] = useState(false);
  const canReveal = !!rest.secureTextEntry && !!(revealLabel || hideLabel);
  return (
    <View style={{ gap: 6 }}>
      {/* A persistent label above the field — the placeholder alone disappears
          the moment the user types, leaving no cue for what the field is. */}
      {label ? <Text variant="label">{label}</Text> : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
          backgroundColor: t.colors.surface,
          borderWidth: 1.5,
          borderColor: error ? t.colors.danger : focus ? t.colors.accent : t.colors.line,
          borderRadius: t.radius.field,
          paddingHorizontal: 15,
          paddingVertical: 14,
          boxShadow: focus && !error ? `0 0 0 3px ${t.colors.accentSoft}` : undefined,
        }}
      >
        {icon ? <Icon name={icon} size={19} color={t.colors.ink3} /> : null}
        {prefix ? <Text style={{ fontSize: 15, fontWeight: '700', color: t.colors.ink2 }}>{prefix}</Text> : null}
        <TextInput
          // Same as Field: the visible label names the input and the error
          // describes it, so the reader announces both on the control itself.
          accessibilityLabel={rest.accessibilityLabel ?? label}
          accessibilityHint={error}
          aria-invalid={!!error}
          placeholderTextColor={t.colors.ink3}
          onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
          style={{ flex: 1, fontSize: 15, fontWeight: '600', color: t.colors.ink, padding: 0 }}
          {...rest}
          // After the spread, so revealing actually overrides the caller's
          // `secureTextEntry` instead of being overwritten by it.
          secureTextEntry={rest.secureTextEntry && !revealed}
        />
        {canReveal ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? hideLabel : revealLabel}
            accessibilityState={{ checked: revealed }}
            // The glyph is 19px. `hitSlop` alone was wrong twice over: it does
            // not grow the bounds an accessibility service reads (measured on
            // device: still 19x19dp), and 12 either side would have landed on
            // 43dp anyway. Padding grows the real box; the negative margin
            // gives back the space, so the field's height does not move.
            style={{ padding: 13, margin: -13 }}
          >
            <Icon name={revealed ? 'eyeOff' : 'eye'} size={19} color={t.colors.ink3} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color={t.colors.danger} accessibilityLiveRegion="assertive" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
