import React from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@chamafacil/shared';
import { styles } from '../styles';

interface Props {
  title: string; // pre-formatted metric (area or perimeter)
  context?: string; // optional label (e.g. the asset part being measured)
  count: number;
  onBack: () => void;
  onClear: () => void;
  clearDisabled: boolean;
}

/** Back button, current metric + point count, and clear. */
export function TopBar({ title, context, count, onBack, onClear, clearDisabled }: Props) {
  const { t } = useTranslation();
  const pointsLabel = count === 1 ? t('ar.pointSingular') : t('ar.pointPlural');
  return (
    <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
      <Pressable onPress={onBack} style={styles.chip}>
        <Text weight="800" style={styles.chipTxt}>‹ {t('ar.back')}</Text>
      </Pressable>
      <View style={styles.chip}>
        {context ? <Text style={styles.chipContext} numberOfLines={1}>{context}</Text> : null}
        <Text weight="800" style={styles.chipTxt}>
          {title} · {count} {pointsLabel}
        </Text>
      </View>
      <Pressable onPress={onClear} style={styles.chip} disabled={clearDisabled}>
        <Text weight="800" style={[styles.chipTxt, { opacity: clearDisabled ? 0.4 : 1 }]}>
          {t('ar.clear')}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
