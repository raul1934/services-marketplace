import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@chamafacil/shared';
import { styles } from '../styles';

/**
 * Shown while no surface is locked: a phone sliding side to side, mirroring the
 * motion ARCore needs to find a plane. Telling someone to "move slowly" works far
 * better when they can see the motion — this is the one instruction that decides
 * whether measuring works at all.
 */
export function ScanOverlay({ visible, reason }: { visible: boolean; reason?: string }) {
  const { t } = useTranslation();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(slide, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, slide]);

  if (!visible) return null;

  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-38, 38] });

  return (
    <View pointerEvents="none" style={styles.scanWrap}>
      <View style={styles.scanCard}>
        <View style={styles.scanStage}>
          <View style={styles.scanFloor} />
          <Animated.View style={[styles.scanPhone, { transform: [{ translateX }] }]}>
            <View style={styles.scanPhoneLens} />
          </Animated.View>
        </View>
        <Text weight="800" style={styles.scanTitle}>{t('ar.scanning')}</Text>
        <Text style={styles.scanHint}>{reason ?? t('ar.scanHint')}</Text>
      </View>
    </View>
  );
}
