import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@chamafacil/shared';
import { styles } from '../styles';
import { MeasureMode, TrackingReason } from '../types';

interface Props {
  crossing: boolean;
  tracking: boolean;
  trackingReason: number;
  count: number;
  mode: MeasureMode;
  reliable: boolean;
}

/** Contextual banner: crossing warning, tracking / surface / free guidance. */
export function StatusBanner({ crossing, tracking, trackingReason, count, mode, reliable }: Props) {
  const { t } = useTranslation();

  let message: string | null = null;
  let warning = false;
  if (crossing) {
    message = t('ar.crossing');
    warning = true;
  } else if (!tracking) {
    // Tell the user WHY tracking is degraded so their scan can fix it.
    if (trackingReason === TrackingReason.ExcessiveMotion) message = t('ar.hintMotion');
    else if (trackingReason === TrackingReason.InsufficientFeatures) message = t('ar.hintFeatures');
    else message = t('ar.hintDetecting');
  } else if (mode === MeasureMode.Free) {
    if (count === 0) message = t('ar.hintFree');
  } else if (!reliable) {
    message = t('ar.hintWaitingPlane');
  } else if (count === 0) {
    message = t('ar.hintAim');
  }

  if (!message) return null;
  return (
    <View pointerEvents="none" style={styles.bannerWrap}>
      <Text style={warning ? styles.warn : styles.hint}>{message}</Text>
    </View>
  );
}

/** Live rubber-band length shown near the centre while drawing a line. */
export function LiveLength({ visible, length }: { visible: boolean; length: number }) {
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={styles.liveWrap}>
      <Text style={styles.liveTxt}>{length.toFixed(2)} m</Text>
    </View>
  );
}
