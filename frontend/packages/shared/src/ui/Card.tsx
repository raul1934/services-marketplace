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
        // A pressable card is a button, but nothing said so out loud: a screen
        // reader read the inner texts as ordinary content, with no clue the card
        // could be activated. `accessible` also collapses the children into one
        // node, so the card is announced as a single item instead of a stream of
        // loose fragments. Callers that can phrase that sentence better pass
        // their own accessibilityLabel — `rest` is spread last so any of these
        // defaults can be overridden.
        accessible
        accessibilityRole="button"
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
