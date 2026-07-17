import React, { useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from '../Text';
import { Icon, IconName } from '../Icon';

/** Icon-prefixed text input with focus ring (chamafacil .input). */
export function AuthField({
  icon,
  prefix,
  error,
  ...rest
}: TextInputProps & { icon?: IconName; prefix?: string; error?: string }) {
  const t = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
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
          placeholderTextColor={t.colors.ink3}
          onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
          style={{ flex: 1, fontSize: 15, fontWeight: '600', color: t.colors.ink, padding: 0 }}
          {...rest}
        />
      </View>
      {error ? <Text variant="caption" color={t.colors.danger}>{error}</Text> : null}
    </View>
  );
}
