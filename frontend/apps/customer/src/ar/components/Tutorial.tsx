import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Text } from '@chamafacil/shared';

interface Step {
  icon: string;
  title: string;
  text: string;
}

/**
 * Onboarding stepper shown before the AR camera. It explains the conditions ARCore
 * needs (light, texture, slow scanning) and how to place points — the parts users
 * can't guess. Rendered as a full-screen overlay so the AR scene can warm up behind it.
 */
const STEP_COUNT = 4;

export function Tutorial({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  // Read steps by index (robust against returnObjects quirks); drop any missing.
  const steps: Step[] = Array.from({ length: STEP_COUNT }, (_, n) => ({
    icon: t(`ar.tutorial.steps.${n}.icon`),
    title: t(`ar.tutorial.steps.${n}.title`),
    text: t(`ar.tutorial.steps.${n}.text`),
  })).filter((s) => s.title && !s.title.startsWith('ar.tutorial'));
  const [i, setI] = useState(0);

  if (steps.length === 0) {
    // Defensive: never trap the user behind a broken tutorial.
    onDone();
    return null;
  }

  const step = steps[i];
  const last = i === steps.length - 1;

  return (
    <View style={styles.backdrop}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={onDone}>
            <Text style={styles.skip}>{t('ar.tutorial.skip')}</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.icon}>{step.icon}</Text>
          <Text weight="800" style={styles.title}>
            {step.title}
          </Text>
          <Text style={styles.text}>{step.text}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {steps.map((_, d) => (
              <View key={d} style={[styles.dot, d === i ? styles.dotOn : null]} />
            ))}
          </View>

          <View style={styles.actions}>
            {i > 0 ? (
              <Pressable style={[styles.btn, styles.btnBack]} onPress={() => setI((v) => v - 1)}>
                <Text weight="700" style={styles.btnBackTxt}>
                  {t('ar.tutorial.back')}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.btnSpacer} />
            )}
            <Pressable style={[styles.btn, styles.btnNext]} onPress={() => (last ? onDone() : setI((v) => v + 1))}>
              <Text weight="800" style={styles.btnNextTxt}>
                {last ? t('ar.tutorial.start') : t('ar.tutorial.next')}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0b0b0f', zIndex: 20 },
  safe: { flex: 1, paddingHorizontal: 24 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 6 },
  skip: { color: '#9aa0ab', fontSize: 15, paddingVertical: 6, paddingHorizontal: 4 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  icon: { fontSize: 76 },
  title: { color: '#fff', fontSize: 23, textAlign: 'center' },
  text: { color: '#c9ced8', fontSize: 16, lineHeight: 23, textAlign: 'center', maxWidth: 340 },

  footer: { gap: 20, paddingBottom: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotOn: { backgroundColor: '#ff6a3d', width: 22 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnSpacer: { flex: 1 },
  btnBack: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  btnBackTxt: { color: '#e9edf5', fontSize: 16 },
  btnNext: { flex: 1.4, backgroundColor: '#ff6a3d' },
  btnNextTxt: { color: '#fff', fontSize: 16 },
});
