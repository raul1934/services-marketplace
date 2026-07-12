import React from 'react';
import { Pressable, View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { focusRing } from '../lib/a11y';

interface Props extends ViewProps {
  flat?: boolean;
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ flat, onPress, padded = true, style, children, ...rest }: Props) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.colors.surface,
    borderRadius: t.radius.card,
    padding: padded ? 18 : 0,
    borderWidth: flat ? 1 : 0,
    borderColor: t.colors.line,
    // chamafacil .card uses the elevated --shadow; .card.flat drops it for a border.
    ...(flat ? {} : t.shadow),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed, hovered, focused }: any) => [
          base,
          (pressed || hovered) && { opacity: 0.92 },
          focusRing(t.colors.accent, focused),
          style,
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[base, style]} {...rest}>
      {children}
    </View>
  );
}
