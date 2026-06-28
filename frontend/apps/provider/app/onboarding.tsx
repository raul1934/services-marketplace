import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Icon,
  ProviderDocumentType,
  Row,
  Screen,
  SectionLabel,
  SlideToConfirm,
  Text,
  useAuth,
  useTheme,
} from '@walvee/shared';
import { providerApi } from '../src/api';
import { useCategories, useSetCategories } from '../src/queries';
import { CatRow } from '../src/components/CatRow';
import { Slider } from '../src/components/Slider';
import { pickDocumentForm } from '../src/documents';

const DOC_TYPES: ProviderDocumentType[] = ['id', 'proof_of_address', 'selfie', 'certificate'];
const TOTAL = 4;

export default function Onboarding() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { refresh, logout } = useAuth();
  const { data: categories, isLoading } = useCategories();
  const setCategories = useSetCategories();

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [radius, setRadius] = useState(15);
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});
  const [busyDoc, setBusyDoc] = useState<string | null>(null);

  const toggle = (id: number) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const uploadDoc = async (type: ProviderDocumentType) => {
    setBusyDoc(type);
    try {
      const form = await pickDocumentForm();
      if (form) {
        await providerApi.uploadDocument(type, form);
        setUploaded((u) => ({ ...u, [type]: true }));
      }
    } catch (e) {
      Alert.alert(tr('onboardingW.docError'), (e as Error).message);
    } finally {
      setBusyDoc(null);
    }
  };

  const submit = async () => {
    try {
      await setCategories.mutateAsync(selected);
      await providerApi.updateProfile({ coverage_radius_km: radius });
      await refresh(); // gate routes to the pending screen
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  const canNext = step !== 0 || selected.length > 0;
  const titles = [tr('onboardingW.step1Title'), tr('onboardingW.step2Title'), tr('onboardingW.step3Title'), tr('onboardingW.step4Title')];
  const subs = [tr('onboardingW.step1Sub'), tr('onboardingW.step2Sub'), tr('onboardingW.step3Sub'), tr('onboardingW.step4Sub')];
  const docsCount = Object.values(uploaded).filter(Boolean).length;
  const circle = Math.min(150, 40 + radius * 4.2);

  // Wizard nav + final submit pinned to the bottom, consistent with the rest of
  // the app (the slide/CTA is always reachable without scrolling).
  const footer = (
    <View style={{ gap: 10 }}>
      {step === TOTAL - 1 && (
        <SlideToConfirm label={tr('onboardingW.slideSubmit')} doneLabel={tr('onboardingW.submitted')} disabled={setCategories.isPending} onConfirm={submit} />
      )}
      <Row gap={10}>
        {step > 0 && <Button title={tr('common.back')} variant="ghost" onPress={() => setStep(step - 1)} />}
        {step < TOTAL - 1 && <Button title={tr('onboardingW.next')} full disabled={!canNext} onPress={() => setStep(step + 1)} style={{ flex: 1 }} />}
      </Row>
    </View>
  );

  return (
    <Screen padded={false} footer={footer}>
      {/* Wiz header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
        <SectionLabel>{tr('onboardingW.setupLabel')}</SectionLabel>
        <Row gap={6}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? t.colors.accent : t.colors.line }} />
          ))}
        </Row>
        <Text style={{ fontSize: 23, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.4 }}>{titles[step]}</Text>
        <Text style={{ color: t.colors.ink2, fontSize: 14, lineHeight: 20 }}>{subs[step]}</Text>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 12 }}>
        {/* STEP 1 — categories */}
        {step === 0 && (
          isLoading ? (
            <ActivityIndicator color={t.colors.accent} style={{ marginTop: 30 }} />
          ) : (
            <>
              {categories?.map((c) => (
                <CatRow key={c.id} category={c} subtitle={tr(`enums.categoryType.${c.type}`)} selected={selected.includes(c.id)} onPress={() => toggle(c.id)} />
              ))}
              <Text variant="caption" weight="600">{tr('onboardingW.selectedCount', { count: selected.length })}</Text>
            </>
          )
        )}

        {/* STEP 2 — coverage radius */}
        {step === 1 && (
          <>
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <View style={{ height: 168, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: circle, height: circle, borderRadius: circle / 2, backgroundColor: t.colors.accentSoft, borderWidth: 2, borderColor: t.colors.accent }} />
                <View style={{ position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#2b8aff', borderWidth: 4, borderColor: '#fff' }} />
              </View>
            </Card>
            <Card flat style={{ gap: 12 }}>
              <Row style={{ alignItems: 'baseline' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.ink3 }}>{tr('onboardingW.coverageRadius')}</Text>
                <View style={{ flex: 1 }} />
                <Text style={{ fontSize: 26, fontWeight: '800', color: t.colors.ink, letterSpacing: -0.4 }}>
                  {radius}<Text style={{ fontSize: 14, color: t.colors.ink2 }}>km</Text>
                </Text>
              </Row>
              <Slider min={2} max={50} value={radius} onChange={setRadius} />
              <Row>
                <Text variant="caption" weight="700">2 km</Text>
                <View style={{ flex: 1 }} />
                <Text variant="caption" weight="700">50 km</Text>
              </Row>
            </Card>
          </>
        )}

        {/* STEP 3 — documents */}
        {step === 2 && (
          <>
            {DOC_TYPES.map((type) => {
              const done = uploaded[type];
              return (
                <Pressable key={type} onPress={() => uploadDoc(type)}>
                  <Row style={{ gap: 12, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.field, padding: 14 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: done ? t.colors.okSoft : t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                      {busyDoc === type ? <ActivityIndicator color={t.colors.accent} /> : <Icon name={done ? 'check' : 'camera'} size={20} color={done ? t.colors.ok : t.colors.ink2} />}
                    </View>
                    <Text weight="700" style={{ flex: 1, fontSize: 14 }}>{tr(`onboardingW.docs.${type}`)}</Text>
                    <Text weight="800" style={{ fontSize: 12.5 }} color={done ? t.colors.ok : t.colors.accent}>
                      {done ? tr('onboardingW.docUploaded') : tr('onboardingW.docAdd')}
                    </Text>
                  </Row>
                </Pressable>
              );
            })}
            <Row style={{ gap: 11, backgroundColor: t.colors.surface2, borderRadius: 14, padding: 13 }}>
              <Icon name="shield" size={18} color={t.colors.ok} />
              <Text variant="caption" weight="600" style={{ flex: 1 }}>{tr('onboardingW.docsBanner')}</Text>
            </Row>
          </>
        )}

        {/* STEP 4 — submit */}
        {step === 3 && (
          <>
            <Card>
              <SumRow icon="briefcase" k={tr('onboardingW.summaryCategories')} v={tr('onboardingW.selectedCount', { count: selected.length })} />
              <SumRow icon="location" k={tr('onboardingW.summaryArea')} v={`${radius} km`} />
              <SumRow icon="shield" k={tr('onboardingW.summaryDocs')} v={tr('onboardingW.docsCount', { count: docsCount })} />
            </Card>
            <Row style={{ gap: 11, backgroundColor: t.colors.accentSoft, borderRadius: 14, padding: 13 }}>
              <Icon name="clock" size={19} color={t.colors.accent} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600' }} color={t.colors.accent}>{tr('onboardingW.reviewBanner')}</Text>
            </Row>
          </>
        )}

        <Text center weight="700" color={t.colors.ink3} onPress={logout} style={{ marginTop: 8 }}>{tr('common.logout')}</Text>
      </View>
    </Screen>
  );
}

function SumRow({ icon, k, v }: { icon: string; k: string; v: string }) {
  const t = useTheme();
  return (
    <Row style={{ gap: 12, paddingVertical: 11 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={t.colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="caption" weight="700">{k}</Text>
        <Text weight="700" style={{ fontSize: 14.5, marginTop: 1 }}>{v}</Text>
      </View>
    </Row>
  );
}
