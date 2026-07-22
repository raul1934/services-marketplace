import React from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { withFocusRing } from '../lib/a11y';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { SlideToConfirm } from './SlideToConfirm';

export interface WizFooter {
  /** Primary "Continue" button (non-final steps). `pulse` adds the notification
   *  badge's breathing ring behind it to draw the eye forward. */
  primary?: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; pulse?: boolean };
  /** Slide-to-confirm (final step). */
  slide?: { label: string; doneLabel: string; onConfirm: () => void; disabled?: boolean; confirmHint?: string };
  /** Show a ghost back button next to the primary. */
  back?: () => void;
}

/**
 * Multi-step wizard chrome (chamafacil Wiz): back/close header with a STEP x/N
 * counter, a progress bar, a scrollable body and a sticky footer.
 */
export function Wiz({
  cat,
  step,
  total,
  title,
  sub,
  onBack,
  backLabel,
  stepLabel,
  footer,
  children,
}: {
  cat: string;
  step: number; // 1-based
  total: number;
  title: string;
  sub?: string;
  onBack: () => void;
  /** Accessible name for the header control — it closes on step 1, goes back after. */
  backLabel: string;
  /** Already-formatted step counter, e.g. "ETAPA 2/4". This package renders
   *  strings, it does not author them, and this one was hardcoded Portuguese. */
  stepLabel: string;
  footer: WizFooter;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    // Both edges: the sticky footer holds the wizard's primary action, and
    // without the bottom inset it renders under Android's nav buttons.
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top', 'bottom']}>
     {/* Shrinks the body when the keyboard opens so the focused field (e.g. the
         multiline description on step 1) scrolls above it instead of being
         covered — "height" resizes on Android edge-to-edge, "padding" on iOS. */}
     <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={backLabel} style={withFocusRing(t.colors.accent, { width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' })}>
          <Icon name={step === 1 ? 'close' : 'back'} size={20} color={t.colors.ink} />
        </Pressable>
        <Text style={{ fontSize: 19, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.2 }} numberOfLines={1}>{cat}</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: t.colors.ink3, letterSpacing: 0.3 }}>{stepLabel}</Text>
      </View>

      {/* progress */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingVertical: 2 }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < step ? t.colors.accent : t.colors.line }} />
        ))}
      </View>

      {/* body */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 13 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 4 }}>
          <Text style={{ fontSize: 23, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.4 }}>{title}</Text>
          {sub ? <Text style={{ color: t.colors.ink2, fontSize: 13.5, marginTop: 3, lineHeight: 19 }}>{sub}</Text> : null}
        </View>
        {children}
      </ScrollView>

      {/* sticky footer */}
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 20, paddingTop: 13, paddingBottom: 26, borderTopWidth: 1, borderColor: t.colors.line, backgroundColor: t.colors.surface }}>
        {footer.slide ? (
          <View style={{ flex: 1 }}>
            <SlideToConfirm label={footer.slide.label} doneLabel={footer.slide.doneLabel} disabled={footer.slide.disabled} onConfirm={footer.slide.onConfirm} confirmHint={footer.slide.confirmHint} />
          </View>
        ) : footer.primary ? (
          <>
            {footer.back && (
              <Pressable onPress={footer.back} style={withFocusRing(t.colors.accent, { height: 50, paddingHorizontal: 18, borderRadius: t.radius.btn, borderWidth: 1.5, borderColor: t.colors.line, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' })}>
                <Icon name="back" size={18} color={t.colors.ink} />
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              {/* The bell badge's breathing ring, sized to the button. Only while
                  enabled — a pulsing dead button reads as broken, not inviting. */}
              {footer.primary.pulse && !footer.primary.disabled ? <PulseRing color={t.colors.accent} radius={t.radius.btn} /> : null}
              <Button title={footer.primary.label} full disabled={footer.primary.disabled} loading={footer.primary.loading} onPress={footer.primary.onPress} right={<Icon name="arrowR" size={18} color={t.colors.accentInk} />} />
            </View>
          </>
        ) : null}
      </View>
     </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * The same breathing ring the notification badge uses (primitives.tsx), sized to
 * sit behind a full-width button: it expands and fades in a loop to pull the eye
 * to the primary action. RN's Animated with useNativeDriver, so it survives a
 * busy JS thread — no reanimated dependency, matching the badge.
 */
function PulseRing({ color, radius }: { color: string; radius: number }) {
  const pulse = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.delay(900),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: radius,
        backgroundColor: color,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
      }}
    />
  );
}
