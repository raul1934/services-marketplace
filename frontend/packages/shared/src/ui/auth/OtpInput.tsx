import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';

/** Six-box OTP entry (chamafacil .otp-row), backed by one hidden numeric input. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
}) {
  const t = useTheme();
  const ref = React.useRef<TextInput>(null);
  const digits = value.split('').slice(0, length);
  const activeIndex = Math.min(digits.length, length - 1);

  return (
    <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: 'row', gap: 9, justifyContent: 'space-between' }}>
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
              borderColor: active || filled ? t.colors.accent : t.colors.line,
              backgroundColor: t.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: active ? `0 0 0 3px ${t.colors.accentSoft}` : undefined,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: '800', color: t.colors.ink }}>{digits[i] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={ref}
        autoFocus={autoFocus}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
    </Pressable>
  );
}
