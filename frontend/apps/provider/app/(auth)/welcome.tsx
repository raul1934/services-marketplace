import React, { useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Text, useTheme } from '@walvee/shared';

const SCENE_ICONS = ['location', 'dollar', 'star'];

export default function Welcome() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [i, setI] = useState(0);
  const slides = tr('welcome.slides', { returnObjects: true }) as { title: string; body: string }[];
  const eyebrows = tr('welcome.eyebrows', { returnObjects: true }) as string[];
  const last = i === slides.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <LinearGradient colors={t.grad as unknown as readonly [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 24 }}>
          <Text weight="800" color="#fff" style={{ fontSize: 20, letterSpacing: 0.5 }}>
            walvee <Text color="rgba(255,255,255,0.7)">pro</Text>
          </Text>
        </SafeAreaView>
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.13)', top: -60, right: -50 }} />
        <View style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.13)', bottom: 30, left: -40 }} />
        <View style={{ width: 150, height: 150, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={SCENE_ICONS[i]} size={64} color="#fff" fill={SCENE_ICONS[i] === 'star' ? 'current' : 'none'} />
        </View>
      </LinearGradient>

      <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -28, padding: 26, paddingBottom: 34, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          {slides.map((_, k) => (
            <View key={k} style={{ width: k === i ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: k === i ? t.colors.accent : t.colors.line }} />
          ))}
        </View>
        <Text style={{ fontSize: 11.5, fontWeight: '800', letterSpacing: 1, color: t.colors.accent }}>{eyebrows[i]?.toUpperCase()}</Text>
        <Text style={{ fontSize: 25, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.5 }}>{slides[i].title}</Text>
        <Text style={{ fontSize: 14.5, lineHeight: 22, color: t.colors.ink2 }}>{slides[i].body}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '700', color: t.colors.ink3 }} onPress={() => router.push('/(auth)/register')}>
            {last ? '' : tr('welcome.skip')}
          </Text>
          <Button title={last ? tr('welcome.cta') : tr('welcome.next')} onPress={() => (last ? router.push('/(auth)/register') : setI(i + 1))} right={<Icon name="arrowR" size={18} color={t.colors.accentInk} />} />
        </View>
        <Text center style={{ fontSize: 13.5, fontWeight: '600', color: t.colors.ink2 }}>
          <Text color={t.colors.accent} weight="800" onPress={() => router.push('/(auth)/login')}>{tr('common.haveAccount')}</Text>
        </Text>
      </View>
    </View>
  );
}
