import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import MapView, { MapPin, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Icon, Row, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';
import { fieldApi } from '../../../src/field/api';
import { ErrorState, Loading, useAsync } from '../../../src/field/async';
import { OpenInMaps } from '../../../src/field/OpenInMaps';

export default function SiteDetail() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: s, loading, error, reload } = useAsync(() => fieldApi.site(id ?? 'rio-fortore'), [id]);

  const running = s?.status === 'running';
  const confirm = async (fn: () => Promise<unknown>) => {
    try { await fn(); } finally { reload(); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <BackBar title={tr('fieldNav.sites')} onBack={() => router.back()} backLabel={tr('field.back')} />
      </SafeAreaView>

      {loading ? <Loading /> : error || !s ? <ErrorState error={error ?? new Error()} onRetry={reload} /> : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text weight="800" style={{ fontSize: 24, letterSpacing: -0.4 }}>{s.name}</Text>
              <Text variant="caption">{tr('field.contract', { name: s.contract })} · {s.address}</Text>
            </View>

            {s.geo ? (
              <View style={{ marginHorizontal: 20, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.line }}>
                <MapView style={{ flex: 1 }} initialRegion={{ latitude: s.geo.lat, longitude: s.geo.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}>
                  <Marker coordinate={{ latitude: s.geo.lat, longitude: s.geo.lng }}>
                    <MapPin color={t.colors.accent} active={running} />
                  </Marker>
                </MapView>
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              <OpenInMaps address={s.address} />
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
              <Text variant="label">{tr('field.siteServices')}</Text>
              {s.services.map((sv, i) => (
                <View key={sv.id} style={{ backgroundColor: t.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: t.colors.line, padding: 12 }}>
                  <Row gap={11} style={{ alignItems: 'center' }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: sv.done ? t.colors.ok : sv.obrig ? t.colors.accent : t.colors.ink3, alignItems: 'center', justifyContent: 'center' }}>
                      <Text weight="800" style={{ fontSize: 12.5, color: '#fff' }}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text weight="700" style={{ fontSize: 14 }}>{sv.name}</Text>
                      <Text variant="caption">{sv.obrig ? tr('field.obrig') : tr('field.optional')} · {sv.rate === 'hour' ? tr('field.rateHour') : tr('field.rateVisit')}</Text>
                    </View>
                  </Row>
                </View>
              ))}
            </View>

            {s.shiftHistory.length ? (
              <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 8 }}>
                <Text variant="label">{tr('field.shiftHistory')}</Text>
                {s.shiftHistory.map((h) => {
                  const doing = h.status === 'doing';
                  return (
                    <View key={h.id} style={{ backgroundColor: t.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: t.colors.line, padding: 12 }}>
                      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text weight="700" style={{ fontSize: 13.5, fontVariant: ['tabular-nums'] }}>{h.time}</Text>
                          <Text variant="caption">{tr('field.services', { n: h.services })}</Text>
                        </View>
                        <View style={{ backgroundColor: doing ? t.colors.accentSoft : t.colors.okSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700' }} color={doing ? t.colors.accent : t.colors.ok}>{doing ? tr('field.statusDoing') : tr('field.statusDone')}</Text>
                        </View>
                      </Row>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: t.colors.line, backgroundColor: t.colors.surface }}>
            {running ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr('field.continueSite')}
                onPress={() => router.push(`/(field)/os/${s.id}`)}
                style={{ backgroundColor: t.colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                <Text weight="800" style={{ fontSize: 15, color: '#fff' }}>{tr('field.continueSite')}</Text>
                <Icon name="chevronsR" size={17} color="#fff" />
              </Pressable>
            ) : (
              <SlideToConfirm label={tr('field.startVisit')} doneLabel={tr('field.startVisitDone')} confirmHint={tr('field.startVisitHint')} onConfirm={() => confirm(() => fieldApi.startSite(s.id))} />
            )}
          </SafeAreaView>
        </>
      )}
    </View>
  );
}
