import { Platform } from 'react-native';

/**
 * Web-only keyboard focus ring for Pressable-based controls. Uses RNW outline
 * style props; returns null on native (and when not focused) so it composes
 * cleanly inside a Pressable `style` callback. Typed `any` because outline*
 * props aren't in the RN ViewStyle type.
 *
 * Why it stays web-only: the `focused` flag comes from the Pressable style
 * callback state, and only react-native-web puts it there — RN core's
 * `PressableStateCallbackType` is `{ pressed }` and nothing else (see
 * react-native/Libraries/Components/Pressable/Pressable.d.ts). On native the
 * argument is permanently `undefined`, and `outline*` isn't a native style
 * prop either, so a "native focus ring" here would be dead code pretending to
 * be a fix. Real D-pad/switch focus visuals on Android need per-control
 * onFocus/onBlur state plus a border- or shadow-based ring, which is a
 * separate change that has to be verified on a device.
 */
export function focusRing(color: string, focused?: boolean): any {
  return focused && Platform.OS === 'web'
    ? { outlineColor: color, outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2 }
    : null;
}

/**
 * Builds a Pressable `style` callback that draws `style` plus the focus ring.
 * Shorthand for controls whose style is otherwise static — keeps the ring from
 * being forgotten just because the control had no reason to use the callback
 * form. Pass `pressedStyle` to also react to touch.
 */
export function withFocusRing(color: string, style: any, pressedStyle?: any): any {
  return ({ focused, pressed }: any) => [style, pressed && pressedStyle ? pressedStyle : null, focusRing(color, focused)];
}
