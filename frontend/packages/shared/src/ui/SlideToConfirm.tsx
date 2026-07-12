import React, { useRef, useState } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Icon } from './Icon';

/** hex + alpha fraction → 8-digit hex. */
function alpha(hex: string, a: number): string {
  const n = Math.round(a * 255).toString(16).padStart(2, '0');
  return hex.length === 7 ? hex + n : hex;
}

export type SlideVariant = 'accept' | 'success' | 'error';

/**
 * Drag-to-confirm control (chamafacil .slide). Track is a translucent accent pill;
 * the thumb travels left→right, a fill follows behind the label, and on
 * completion the track goes solid with the thumb resting on the right.
 */
export function SlideToConfirm({
  label,
  doneLabel,
  onConfirm,
  disabled,
  variant = 'accept',
  compact,
}: {
  label: string;
  doneLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  variant?: SlideVariant;
  compact?: boolean;
}) {
  const t = useTheme();
  const color = variant === 'success' ? t.colors.ok : variant === 'error' ? t.colors.danger : t.colors.accent;
  const H = compact ? 50 : 58;
  const THUMB = compact ? 42 : 50;
  const PAD = 4;

  const [trackW, setTrackW] = useState(0);
  const [done, setDone] = useState(false);
  const x = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const maxX = Math.max(0, trackW - THUMB - PAD * 2);

  // The PanResponder is created once, so its closure would otherwise capture the
  // first-render values (maxX = 0 before onLayout, plus a stale onConfirm). Keep
  // the live values in a ref the handlers can read on every gesture.
  const live = useRef({ maxX, done, disabled, onConfirm });
  live.current = { maxX, done, disabled, onConfirm };

  const pan = useRef(
    PanResponder.create({
      // Claim the gesture on touch-down too — this is what makes react-native-web
      // engage the responder (and the press feedback fire) for mouse/click, not
      // just for a move that crosses the slop threshold.
      onStartShouldSetPanResponder: () => !live.current.disabled && !live.current.done,
      onMoveShouldSetPanResponder: () => !live.current.disabled && !live.current.done,
      onPanResponderGrant: () => {
        Animated.spring(scale, { toValue: 1.08, friction: 6, useNativeDriver: false }).start();
      },
      onPanResponderMove: (_, g) => x.setValue(Math.min(Math.max(0, g.dx), live.current.maxX)),
      onPanResponderRelease: (_, g) => {
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: false }).start();
        const m = live.current.maxX;
        // m > 0 guards against a layout race; a plain click (dx ≈ 0) springs back
        // instead of confirming, so the drag stays the only way to confirm.
        if (m > 0 && g.dx >= m * 0.85) {
          Animated.timing(x, { toValue: m, duration: 120, useNativeDriver: false }).start(() => {
            setDone(true);
            live.current.onConfirm();
          });
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: false }).start();
        Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
      },
    }),
  ).current;

  const fillWidth = x.interpolate({ inputRange: [0, maxX || 1], outputRange: [THUMB + PAD, trackW] });

  return (
    <View
      testID="slideToConfirm"
      onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      style={{
        height: H,
        borderRadius: 999,
        backgroundColor: done ? color : alpha(color, 0.14),
        justifyContent: 'center',
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {!done && (
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: fillWidth, backgroundColor: alpha(color, 0.3), borderRadius: 999 }} />
      )}

      <Text weight="700" color={done ? '#fff' : color} style={{ position: 'absolute', alignSelf: 'center', fontSize: compact ? 14 : 15 }}>
        {done ? doneLabel : label}
      </Text>

      <Animated.View
        {...pan.panHandlers}
        style={{
          position: 'absolute',
          left: done ? undefined : PAD,
          right: done ? PAD : undefined,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: done ? '#fff' : color,
          alignItems: 'center',
          justifyContent: 'center',
          transform: done ? [] : [{ translateX: x }, { scale }],
        }}
      >
        <Icon name={done ? 'check' : variant === 'error' ? 'close' : 'chevronsR'} size={compact ? 20 : 22} color={done ? color : '#fff'} strokeWidth={2.4} />
      </Animated.View>
    </View>
  );
}
