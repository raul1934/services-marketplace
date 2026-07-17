import React, { useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AvInit, BrandMark, Button, Icon, IconName, MiniMap, Text, useTheme } from '@chamafacil/shared';
import { EnvSwitch } from '../../src/components/EnvSwitch';

const TMINI_SHADOW = '0 22px 44px -18px rgba(15,23,42,0.55)';
const FLOAT_SHADOW = '0 14px 30px -10px rgba(15,23,42,0.5)';

/** Floating mini card used inside the tutorial scenes (chamafacil .tmini). */
function TMini({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.colors.surface, borderRadius: 18, padding: 13, boxShadow: TMINI_SHADOW } as ViewStyle, style]}>
      {children}
    </View>
  );
}

/** Small rounded category icon tile (chamafacil .cat-ic, scene size). */
function CatIc({ name }: { name: IconName }) {
  const t = useTheme();
  return (
    <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={16} color={t.colors.accent} />
    </View>
  );
}

/** Pill that floats over a scene (chamafacil .tut-float). */
function TutFloat({ icon, label, style }: { icon: IconName; label: string; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: t.colors.surface, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13, boxShadow: FLOAT_SHADOW } as ViewStyle, style]}>
      <Icon name={icon} size={15} color={t.colors.accent} fill="current" />
      <Text weight="800" style={{ fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const CATS: { ic: IconName; n: string }[] = [
  { ic: 'car', n: 'Estrada' },
  { ic: 'drop', n: 'Casa' },
  { ic: 'key', n: 'Chaveiro' },
  { ic: 'paw', n: 'Pets' },
];

/** Scene 1 — "ask for help": category picker card + ETA float. */
function SceneHelp() {
  const t = useTheme();
  return (
    <View style={{ width: '100%', height: 280, alignItems: 'center', justifyContent: 'center' }}>
      <TMini style={{ width: 238, transform: [{ rotate: '-4deg' }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 }}>
          <CatIc name="search" />
          <Text weight="800" style={{ fontSize: 13 }}>Do que você precisa?</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATS.map((c) => (
            <View key={c.n} style={{ width: 100, backgroundColor: t.colors.surface2, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 10, gap: 7 }}>
              <CatIc name={c.ic} />
              <Text weight="700" style={{ fontSize: 12 }}>{c.n}</Text>
            </View>
          ))}
        </View>
      </TMini>
      <TutFloat icon="flash" label="Profissional em ~6 min" style={{ position: 'absolute', bottom: 18, right: 6, transform: [{ rotate: '3deg' }] }} />
    </View>
  );
}

/** A single bid row (chamafacil BidMini). */
function BidMini({ initials, color, name, rating, price, eta }: { initials: string; color: string; name: string; rating: string; price: string; eta: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <AvInit initials={initials} color={color} size={34} />
      <View style={{ flex: 1 }}>
        <Text weight="800" style={{ fontSize: 12.5 }}>{name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Icon name="star" size={11} color={t.colors.accent2} fill="current" />
          <Text weight="700" style={{ fontSize: 11, color: t.colors.ink2 }}>{rating}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text weight="800" style={{ fontSize: 15 }}>R$ {price}</Text>
        <Text weight="700" style={{ fontSize: 10, color: t.colors.ink3 }}>{eta} min</Text>
      </View>
    </View>
  );
}

/** Scene 2 — "compare bids": two overlapping bid cards. */
function SceneBids() {
  const t = useTheme();
  return (
    <View style={{ width: '100%', height: 280, alignItems: 'center', justifyContent: 'center' }}>
      <TMini style={{ position: 'absolute', width: 216, opacity: 0.94, transform: [{ translateX: 40 }, { translateY: 50 }, { rotate: '6deg' }] }}>
        <BidMini initials="JS" color="#10b981" name="João S." rating="4.7" price="95" eta="12" />
      </TMini>
      <TMini style={{ position: 'absolute', width: 224, transform: [{ translateX: -26 }, { translateY: -34 }, { rotate: '-3deg' }] }}>
        <View style={{ position: 'absolute', top: -9, right: 14, zIndex: 1, backgroundColor: t.colors.accentSoft, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 }}>
          <Text weight="800" style={{ fontSize: 10, color: t.colors.accent }}>Melhor opção</Text>
        </View>
        <BidMini initials="RC" color="#3b82f6" name="Rafael C." rating="4.9" price="120" eta="8" />
      </TMini>
    </View>
  );
}

/** Scene 3 — "track & pay": map + secured-payment row. */
function SceneTrack() {
  const t = useTheme();
  return (
    <View style={{ width: '100%', height: 280, alignItems: 'center', justifyContent: 'center' }}>
      <TMini style={{ width: 240, padding: 0, overflow: 'hidden', transform: [{ rotate: '-3deg' }] }}>
        <MiniMap height={124} route puck={false} radius={0} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12 }}>
          <CatIc name="pix" />
          <View style={{ flex: 1 }}>
            <Text weight="800" style={{ fontSize: 12 }}>Pago com Pix</Text>
            <Text weight="700" style={{ fontSize: 10.5, color: t.colors.ok }}>Protegido pela Chama Fácil</Text>
          </View>
          <Text weight="800" style={{ fontSize: 15 }}>R$ 120</Text>
        </View>
      </TMini>
    </View>
  );
}

const SCENES = [SceneHelp, SceneBids, SceneTrack];

export default function Welcome() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const slides = tr('welcome.slides', { returnObjects: true }) as { title: string; body: string }[];
  const eyebrows = tr('welcome.eyebrows', { returnObjects: true }) as string[];
  const last = i === slides.length - 1;
  const Scene = SCENES[i] ?? SceneHelp;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {/* hero */}
      <LinearGradient colors={t.grad as unknown as readonly [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {/* Decorative blobs first: they sit *under* the header, and take no
            touches. Drawn on top they swallowed taps on the EnvSwitch, which is
            exactly where the top-right one lands. */}
        <View pointerEvents="none" style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.13)', top: -60, right: -50 }} />
        <View pointerEvents="none" style={{ position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.13)', bottom: 30, left: -40 }} />
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 24, zIndex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <BrandMark onAccent height={26} />
            <EnvSwitch onAccent />
          </View>
        </SafeAreaView>
        <Scene />
      </LinearGradient>

      {/* card */}
      {/* This screen builds its own chrome instead of using <Screen>, so it has
          to add the bottom inset itself — otherwise "Já tem conta? Entrar" sits
          under Android's nav buttons. */}
      <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -28, padding: 26, paddingBottom: 34 + insets.bottom, gap: 14 }}>
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
          <Button
            title={last ? tr('welcome.getStarted') : tr('welcome.next')}
            onPress={() => (last ? router.push('/(auth)/register') : setI(i + 1))}
            right={<Icon name="arrowR" size={18} color={t.colors.accentInk} />}
          />
        </View>
        <Text center style={{ fontSize: 13.5, fontWeight: '600', color: t.colors.ink2 }}>
          {tr('register.toLoginPrefix')} <Text color={t.colors.accent} weight="800" onPress={() => router.push('/(auth)/login')}>{tr('register.toLoginLink')}</Text>
        </Text>
      </View>
    </View>
  );
}
