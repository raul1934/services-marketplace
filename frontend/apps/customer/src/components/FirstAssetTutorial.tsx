import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, Text, useTheme } from '@chamafacil/shared';

/** One icon per step, in step order. */
const ICONS = ['home', 'camera', 'wrench'];

/**
 * First-run tutorial: the full-screen welcome for someone with no assets yet.
 *
 * Opens by itself — a new account has nothing to look at, so there's no screen
 * to interrupt. It is skippable and remembers being skipped: the home keeps a
 * quieter card in its place, so the invitation stays without nagging.
 */
export function FirstAssetTutorial({ onDone }: { onDone: () => void }) {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [i, setI] = useState(0);

  // Read by index and drop anything missing, so a broken/partial translation
  // can't trap someone behind an empty tutorial.
  const steps = ICONS.map((icon, n) => ({
    icon,
    title: tr(`firstAsset.steps.${n}.title`),
    body: tr(`firstAsset.steps.${n}.body`),
  })).filter((s) => !s.title.startsWith('firstAsset.'));

  if (steps.length === 0) {
    onDone();
    return null;
  }

  const last = i === steps.length - 1;
  const step = steps[i];

  const start = () => {
    onDone();
    router.push('/assets/new');
  };

  return (
    // A Modal, not an absolute overlay: this renders from inside the home's
    // scroll view, where `position: absolute` would be clipped to the content
    // box instead of covering the screen.
    <Modal visible transparent={false} animationType="fade" onRequestClose={onDone} statusBarTranslucent>
      <LinearGradient
        colors={t.grad as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 20 }}>
            <Pressable onPress={onDone} hitSlop={10}>
              <Text weight="800" color="rgba(255,255,255,0.9)" style={{ fontSize: 14 }}>
                {tr('firstAsset.skip')}
              </Text>
            </Pressable>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 22 }}>
            <View
              style={{
                width: 128,
                height: 128,
                borderRadius: 40,
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.28)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={step.icon} size={58} color="#fff" />
            </View>
            <Text weight="800" color="#fff" style={{ fontSize: 26, textAlign: 'center', lineHeight: 32 }}>
              {step.title}
            </Text>
            <Text color="rgba(255,255,255,0.92)" style={{ fontSize: 15.5, textAlign: 'center', lineHeight: 23 }}>
              {step.body}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, paddingBottom: 22 }}>
            {steps.map((_, n) => (
              <View
                key={n}
                style={{
                  width: n === i ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: n === i ? '#fff' : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </View>

          <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            {/* White-on-gradient isn't one of Button's variants, and adding one
                for a single screen would widen the shared API for nothing. */}
            <Pressable
              onPress={last ? start : () => setI(i + 1)}
              accessibilityRole="button"
              style={{
                height: 52,
                borderRadius: t.radius.btn,
                backgroundColor: '#fff',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Text weight="800" color={t.colors.accent} style={{ fontSize: 15.5 }}>
                {last ? tr('firstAsset.cta') : tr('welcome.next')}
              </Text>
              <Icon name="arrowR" size={18} color={t.colors.accent} />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}
