import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useDictation } from '../lib/dictation';
import { withFocusRing } from '../lib/a11y';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';

/**
 * Voice-to-text modal: opens a mic sheet, streams the transcript live as the
 * user speaks, and lets them Confirm (→ `onConfirm(text)`) or Cancel. The host
 * field decides what to do with the confirmed text (append/replace).
 */
export function DictationModal({
  visible,
  onClose,
  onConfirm,
  lang = 'pt-BR',
  title = 'Ditado por voz',
  listeningLabel = 'Ouvindo… fale agora',
  idleLabel = 'Toque no microfone para falar',
  placeholder = 'O que você falar aparece aqui.',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
  lang?: string;
  title?: string;
  listeningLabel?: string;
  idleLabel?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  const t = useTheme();

  // Modals render outside the screen's SafeAreaView, so the sheet has to

  // clear Android's navigation bar itself.

  const insets = useSafeAreaInsets();
  const [finalText, setFinalText] = useState('');
  const [partial, setPartial] = useState('');
  const pulse = useRef(new Animated.Value(0)).current;

  const d = useDictation({
    lang,
    interim: true,
    onResult: (chunk) => {
      setPartial('');
      setFinalText((prev) => (prev ? `${prev} ${chunk}` : chunk));
    },
    onPartial: (text) => setPartial(text),
  });

  // Start listening when opened; stop + reset when closed.
  useEffect(() => {
    if (visible) {
      setFinalText('');
      setPartial('');
      void d.start();
    } else {
      d.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Pulsing ring while actively listening.
  useEffect(() => {
    if (!d.listening) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [d.listening, pulse]);

  const shown = `${finalText} ${partial}`.trim();

  const confirm = () => {
    d.stop();
    onConfirm(shown);
  };
  const cancel = () => {
    d.stop();
    onClose();
  };

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={cancel}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={cancel}>
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 + insets.bottom, gap: 18 }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.colors.line }} />
          <Text variant="h3" center>{title}</Text>

          {/* mic with pulsing ring */}
          <Pressable onPress={d.toggle} style={withFocusRing(t.colors.accent, { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, borderRadius: 60 })}>
            {d.listening && (
              <Animated.View
                style={{ position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: t.colors.accent, opacity: ringOpacity, transform: [{ scale: ringScale }] }}
              />
            )}
            {d.listening ? (
              <LinearGradient
                colors={t.grad as unknown as readonly [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' }, t.shadowSm]}
              >
                <Icon name="mic" size={36} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: t.colors.surface2, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mic" size={34} color={t.colors.ink3} />
              </View>
            )}
          </Pressable>

          <Text variant="caption" center>{d.listening ? listeningLabel : idleLabel}</Text>

          {/* live transcript */}
          <ScrollView
            style={{ maxHeight: 140, backgroundColor: t.colors.surface2, borderRadius: t.radius.field, borderWidth: 1, borderColor: t.colors.line }}
            contentContainerStyle={{ padding: 14 }}
          >
            {shown ? (
              <Text style={{ fontSize: 15, lineHeight: 21 }}>
                {finalText}
                {partial ? <Text color={t.colors.ink3}>{finalText ? ' ' : ''}{partial}</Text> : null}
              </Text>
            ) : (
              <Text variant="caption" color={t.colors.ink3}>{placeholder}</Text>
            )}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button title={cancelLabel} variant="ghost" full onPress={cancel} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={confirmLabel} variant="grad" full disabled={!shown} onPress={confirm} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
