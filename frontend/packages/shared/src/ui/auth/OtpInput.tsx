import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';

/**
 * Six-box OTP entry (chamafacil .otp-row), backed by one real numeric input.
 *
 * Accessibility: the boxes are decoration — only the `TextInput` is exposed, so
 * a screen reader announces one labelled field instead of N unlabelled Views.
 * The input is stretched over the whole row (still invisible) so its focus
 * rectangle and touch target match what is drawn; a 1x1px input left TalkBack
 * with nothing to point at. The error message is a live region so a rejected
 * code is announced without the user having to go hunting for it, and it also
 * turns the boxes red — colour alone was the only error signal before, and
 * there wasn't even that.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
  label,
  hint,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  /**
   * Announced name of the field. Required rather than defaulted: this package is
   * locale-neutral — every string it shows arrives already translated — and a
   * default here would announce one language to speakers of the other.
   */
  label: string;
  /** Announced hint, e.g. "6 digits". Pass it translated, same reason as `label`. */
  hint?: string;
  /** Error message: shown under the boxes, announced, and reddens the border. */
  error?: string | null;
}) {
  const t = useTheme();
  const ref = React.useRef<TextInput>(null);
  const digits = value.split('').slice(0, length);
  const activeIndex = Math.min(digits.length, length - 1);
  const borderFor = (lit: boolean) => (error ? t.colors.danger : lit ? t.colors.accent : t.colors.line);

  return (
    <View style={{ gap: 6 }}>
      <Pressable onPress={() => ref.current?.focus()} accessible={false}>
        <View
          style={{ flexDirection: 'row', gap: 9, justifyContent: 'space-between' }}
          // Decorative: the digits are already announced by the input below.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {Array.from({ length }).map((_, i) => {
            const filled = i < digits.length;
            const active = i === activeIndex;
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 58,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: borderFor(active || filled),
                  backgroundColor: t.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: active && !error ? `0 0 0 3px ${t.colors.accentSoft}` : undefined,
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: '800', color: t.colors.ink }}>{digits[i] ?? ''}</Text>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={ref}
          autoFocus={autoFocus}
          value={value}
          onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={length}
          accessibilityLabel={label}
          accessibilityHint={hint}
          // The caret and glyphs stay invisible (the boxes draw them), but the
          // input keeps the full size of the row so it can be focused and tapped.
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 }}
        />
      </Pressable>
      {error ? (
        <Text variant="caption" color={t.colors.danger} center accessibilityLiveRegion="assertive" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
