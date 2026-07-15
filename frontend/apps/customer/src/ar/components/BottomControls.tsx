import React from 'react';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@chamafacil/shared';
import { styles } from '../styles';

interface Props {
  lineMode: boolean;
  onToggleLine: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
  snapped: boolean;
  onUndo: () => void;
  undoDisabled: boolean;
}

/** The two primary actions (toggle line + confirm point) plus a compact undo. */
export function BottomControls({ lineMode, onToggleLine, onConfirm, canConfirm, snapped, onUndo, undoDisabled }: Props) {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['bottom']} style={styles.bottomBar} pointerEvents="box-none">
      <Pressable onPress={onToggleLine} style={[styles.btn, styles.btnToggle, lineMode ? styles.btnToggleOn : null]}>
        <Text weight="800" style={[styles.btnTxt, { color: lineMode ? '#1a120c' : '#fff' }]}>
          🔗 {lineMode ? t('ar.lineOn') : t('ar.line')}
        </Text>
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
