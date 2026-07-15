import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@chamafacil/shared';
import { styles } from '../styles';
import { MeasureMode } from '../types';

/** Switch between plane-only (surface) and any-hit (free) confirmation. */
export function ModeToggle({ mode, onChange }: { mode: MeasureMode; onChange: (m: MeasureMode) => void }) {
  const { t } = useTranslation();
  const options: { value: MeasureMode; label: string }[] = [
    { value: MeasureMode.Surface, label: t('ar.modeSurface') },
    { value: MeasureMode.Free, label: t('ar.modeFree') },
  ];
  return (
    <SafeAreaView edges={['top']} pointerEvents="box-none" style={styles.modeWrap}>
      <View style={styles.modeSeg}>
        {options.map((o) => {
          const active = mode === o.value;
          return (
            <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.modeBtn, active ? styles.modeBtnOn : null]}>
              <Text weight="800" style={[styles.modeTxt, { color: active ? '#1a120c' : '#fff' }]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
