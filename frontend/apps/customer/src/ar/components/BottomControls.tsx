import React from 'react';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@chamafacil/shared';
import { styles } from '../styles';

interface Props {
  onHelp: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
  snapped: boolean;
  onUndo: () => void;
  undoDisabled: boolean;
}

/**
 * Confirm point (primary), with help and undo flanking it.
 *
 * The rubber-band line used to be a toggle; it's always on now — you're always
 * measuring from the last point, so hiding the preview only ever hid what you were
 * about to measure. Help took the freed slot: it was a floating button overlapping
 * the dev menu, and it belongs next to the action it explains.
 */
export function BottomControls({ onHelp, onConfirm, canConfirm, snapped, onUndo, undoDisabled }: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['bottom']} style={styles.bottomBar} pointerEvents="box-none">
      <Pressable onPress={onHelp} accessibilityLabel={t('ar.help')} style={[styles.btn, styles.btnToggle]}>
        <Text weight="800" style={[styles.btnTxt, { color: '#fff' }]}>? {t('ar.help')}</Text>
      </Pressable>
      <Pressable
        onPress={onConfirm}
        accessibilityRole="button"
        style={[styles.btn, styles.btnMain, { opacity: canConfirm ? 1 : 0.45 }]}
        disabled={!canConfirm}
      >
        <Text weight="800" style={styles.btnMainTxt}>{snapped ? `🎯 ${t('ar.confirmSnap')}` : `+ ${t('ar.confirmPoint')}`}</Text>
      </Pressable>
      <Pressable onPress={onUndo} accessibilityLabel={t('ar.undo')} style={[styles.btn, styles.btnUndo]} disabled={undoDisabled}>
        <Text weight="800" style={[styles.btnTxt, { color: '#fff', opacity: undoDisabled ? 0.4 : 1 }]}>↺</Text>
      </Pressable>
    </SafeAreaView>
  );
}
