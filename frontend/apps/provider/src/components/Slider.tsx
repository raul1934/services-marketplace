import React, { useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { useTheme } from '@walvee/shared';

/** Minimal range slider (track + fill + thumb) driven by a pan gesture. */
export function Slider({
  min,
  max,
  value,
  step = 1,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const clampToStep = (v: number) => {
    const c = Math.min(max, Math.max(min, v));
    return Math.round(c / step) * step;
  };

  const fromX = (x: number) => {
    const w = widthRef.current;
    if (!w) return;
    const frac = Math.min(1, Math.max(0, x / w));
    onChange(clampToStep(min + frac * (max - min)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => fromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => fromX(e.nativeEvent.locationX),
    }),
  ).current;

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <View
      {...pan.panHandlers}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      style={{ height: 26, justifyContent: 'center' }}
    >
      <View style={{ height: 7, borderRadius: 999, backgroundColor: t.colors.line }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, backgroundColor: t.colors.accent, borderRadius: 999 }} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: Math.max(0, Math.min(width - 26, (pct / 100) * width - 13)),
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: t.colors.accent,
          borderWidth: 4,
          borderColor: t.colors.surface,
          ...t.shadowSm,
        }}
      />
    </View>
  );
}
