import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ViewStyle } from 'react-native';

/**
 * The same pulse the active location pin has on the map — a halo that grows out
 * of the shape and fades, on a loop (a radar "ping"). The map draws it in CSS
 * (`@keyframes cfp`: scale .7→2.4, opacity .5→0, 1.6s ease-out); this is the
 * React Native twin of that, for buttons.
 *
 * Place it as the FIRST child of a relatively-positioned container (a plain RN
 * View is `relative` by default) that does NOT clip its overflow — the halo has
 * to bleed past the edges to be seen. It sits behind the real content, ignores
 * touches, and matches the container's rounded shape.
 *
 * Where the map pin scales uniformly (fine for a small dot), a wide button can't:
 * a uniform scale would throw the halo hundreds of pixels sideways. So the halo
 * instead grows a fixed number of pixels on every side, which reads the same on a
 * dot or a full-width button.
 *
 * Honours "reduce motion": renders nothing when the OS setting is on.
 */
export function Pulse({
  color,
  /** The container's corner radius, so the halo's corners line up with it. */
  radius = 14,
  /** How far, in px, the halo grows past each edge at its peak. */
  spread = 12,
  style,
}: {
  color: string;
  radius?: number;
  spread?: number;
  style?: ViewStyle;
}) {
  const [reduce, setReduce] = useState(false);
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => alive && setReduce(on));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduce) return;
    p.setValue(0);
    const loop = Animated.loop(
      Animated.timing(p, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: false }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, p]);

  if (reduce) return null;

  const inset = p.interpolate({ inputRange: [0, 1], outputRange: [0, -spread] });
  const opacity = p.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const borderRadius = p.interpolate({ inputRange: [0, 1], outputRange: [radius, radius + spread] });

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { position: 'absolute', top: inset, left: inset, right: inset, bottom: inset, borderRadius, backgroundColor: color, opacity },
        style,
      ]}
    />
  );
}
