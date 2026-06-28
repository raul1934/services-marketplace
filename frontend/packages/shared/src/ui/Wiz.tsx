import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { SlideToConfirm } from './SlideToConfirm';

export interface WizFooter {
  /** Primary "Continue" button (non-final steps). */
  primary?: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };
  /** Slide-to-confirm (final step). */
  slide?: { label: string; doneLabel: string; onConfirm: () => void; disabled?: boolean };
  /** Show a ghost back button next to the primary. */
  back?: () => void;
}

/**
 * Multi-step wizard chrome (walvee Wiz): back/close header with a STEP x/N
 * counter, a progress bar, a scrollable body and a sticky footer.
 */
export function Wiz({
  cat,
  step,
  total,
  title,
  sub,
  onBack,
  footer,
  children,
}: {
  cat: string;
  step: number; // 1-based
  total: number;
  title: string;
  sub?: string;
  onBack: () => void;
  footer: WizFooter;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={['top']}>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
        <Pressable onPress={onBack} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={step === 1 ? 'close' : 'back'} size={20} color={t.colors.ink} />
        </Pressable>
        <Text style={{ fontSize: 19, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.2 }} numberOfLines={1}>{cat}</Text>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 12.5, fontWeight: '800', color: t.colors.ink3, letterSpacing: 0.3 }}>{`ETAPA ${step}/${total}`}</Text>
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
            <SlideToConfirm label={footer.slide.label} doneLabel={footer.slide.doneLabel} disabled={footer.slide.disabled} onConfirm={footer.slide.onConfirm} />
          </View>
        ) : footer.primary ? (
          <>
            {footer.back && (
              <Pressable onPress={footer.back} style={{ height: 50, paddingHorizontal: 18, borderRadius: t.radius.btn, borderWidth: 1.5, borderColor: t.colors.line, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="back" size={18} color={t.colors.ink} />
              </Pressable>
            )}
            <Button title={footer.primary.label} full disabled={footer.primary.disabled} loading={footer.primary.loading} onPress={footer.primary.onPress} right={<Icon name="arrowR" size={18} color={t.colors.accentInk} />} style={{ flex: 1 }} />
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
