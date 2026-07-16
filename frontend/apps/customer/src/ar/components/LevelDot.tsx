import React from 'react';
import { View } from 'react-native';
import { Text } from '@chamafacil/shared';
import { COLOR_LEVEL_OFF, COLOR_LEVEL_OK } from '../constants';
import { useLevel } from '../hooks/useLevel';
import { styles } from '../styles';

/**
 * Left/right level indicator: a green dot while the phone is upright within
 * tolerance, red once it's tilted. Holding the phone level keeps the measurement
 * plane consistent. Only the roll axis is checked — pitch is expected to vary
 * (you aim up/down at what you're measuring).
 */
export function LevelDot() {
  const { roll, level } = useLevel();
  return (
    <View pointerEvents="none" style={styles.levelWrap}>
      <View style={[styles.levelDot, { backgroundColor: level ? COLOR_LEVEL_OK : COLOR_LEVEL_OFF }]} />
      <Text weight="800" style={styles.levelTxt}>{`${Math.round(roll)}°`}</Text>
    </View>
  );
}
