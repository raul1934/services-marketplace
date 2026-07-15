import React from 'react';
import { View } from 'react-native';
import { COLOR_ACCENT, COLOR_SNAP } from '../constants';
import { styles } from '../styles';

interface Props {
  active: boolean; // a reticle exists
  snapped: boolean;
  reliable: boolean; // on a plane / snapped / touch mode
}

/** Centre reticle: white idle, grey when unreliable, orange on a surface, green when snapped. */
export function Crosshair({ active, snapped, reliable }: Props) {
  const color = !active
    ? 'rgba(255,255,255,0.85)'
    : snapped
      ? COLOR_SNAP
      : reliable
        ? COLOR_ACCENT
        : 'rgba(180,180,180,0.7)';
  return (
    <View pointerEvents="none" style={styles.centerWrap}>
      <View style={[styles.crosshair, { borderColor: color }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </View>
  );
}
