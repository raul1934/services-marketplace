import { Platform } from 'react-native';

/**
 * Web-only keyboard focus ring for Pressable-based controls. Uses RNW outline
 * style props; returns null on native (and when not focused) so it composes
 * cleanly inside a Pressable `style` callback. Typed `any` because outline*
 * props aren't in the RN ViewStyle type.
 */
export function focusRing(color: string, focused?: boolean): any {
  return focused && Platform.OS === 'web'
    ? { outlineColor: color, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2 }
    : null;
}
