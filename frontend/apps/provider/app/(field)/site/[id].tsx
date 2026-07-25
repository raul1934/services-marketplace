import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import MapView, { MapPin, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Row, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';
import { SITE_GEO, siteStatus, SITES } from '../../../src/field/data';
import { OpenInMaps } from '../../../src/field/OpenInMaps';

export default function SiteDetail() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = SITES[id ?? ''] ?? SITES['rio-fortore'];
  const geo = SITE_GEO[s.id];
  const [running, setRunning] = useState(siteStatus(s.id) === 'running');

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <BackBar title={tr('fieldNav.sites')} onBack={() => router.back()} backLabel={tr('field.back')} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text weight="800" style={{ fontSize: 24, letterSpacing: -0.4 }}>{s.name}</Text>
          <Text variant="caption">{tr('field.contract', { name: s.contract })} · {s.address}</Text>
        </View>

        {/* map */}
        {geo ? (
          <View style={{ marginHorizontal: 20, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.line }}>
            <MapView style={{ flex: 1 }} initialRegion={{ latitude: geo.lat, longitude: geo.lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}>
              <Marker coordinate={{ latitude: geo.lat, longitude: geo.lng }}>
                <MapPin color={t.colors.accent} active={running} />
              </Marker>
            </MapView>
          </View>
        ) : null}

        {/* external navigation */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <OpenInMaps address={s.address} />
        </View>

        {/* numbered service list */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
          <Text variant="label">{tr('field.siteServices')}</Text>
          {s.services.map((sv, i) => (
            <View key={sv.id} style={{ backgroundColor: t.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: t.colors.line, padding: 12 }}>
              <Row gap={11} style={{ alignItems: 'center' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: sv.obrig ? t.colors.accent : t.colors.ink3, alignItems: 'center', justifyContent: 'center' }}>
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
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: t.colors.line, backgroundColor: t.colors.surface }}>
        {running ? (
          <SlideToConfirm variant="success" label={tr('field.finishVisit')} doneLabel={tr('field.finishVisitDone')} confirmHint={tr('field.finishVisitHint')} onConfirm={() => setRunning(false)} />
        ) : (
          <SlideToConfirm label={tr('field.startVisit')} doneLabel={tr('field.startVisitDone')} confirmHint={tr('field.startVisitHint')} onConfirm={() => router.push(`/(field)/os/${s.id}`)} />
        )}
      </SafeAreaView>
    </View>
  );
}
