import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import MapView, { MapLabel, MapPin, Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { fieldApi, Geo } from '../../../src/field/api';
import { ErrorState, Loading, useAsync } from '../../../src/field/async';
import { OpenInMaps } from '../../../src/field/OpenInMaps';
import { edgeMidpoint, metersBetweenLL, polygonAreaSqm, polygonCentroid } from '../../../src/location';

function regionFor(pts: Geo[]) {
  const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    // Tight enough to read the geofence, with room for the side labels outside.
    latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.003),
    longitudeDelta: Math.max((maxLng - minLng) * 1.7, 0.003),
  };
}

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

            {s.geo || (s.geofence && s.geofence.length) ? (
              <View style={{ marginHorizontal: 20, height: 240, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.line }}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={s.geofence && s.geofence.length >= 3 ? regionFor(s.geofence) : { latitude: s.geo!.lat, longitude: s.geo!.lng, latitudeDelta: 0.006, longitudeDelta: 0.006 }}
                >
                  {s.geofence && s.geofence.length >= 3 ? (
                    <Polygon coordinates={s.geofence.map((p) => ({ latitude: p.lat, longitude: p.lng }))} strokeColor={t.colors.accent} strokeWidth={2} fillColor={t.colors.accent} fillOpacity={0.12} />
                  ) : null}
                  {s.geofence && s.geofence.length >= 3
                    ? s.geofence.map((p, i) => {
                        const next = s.geofence![(i + 1) % s.geofence!.length];
                        const mid = edgeMidpoint(p, next);
                        const c = polygonCentroid(s.geofence!);
                        // Push the label outside the ring, away from the centre.
                        const out = { lat: mid.lat + (mid.lat - c.lat) * 0.6, lng: mid.lng + (mid.lng - c.lng) * 0.6 };
                        return (
                          <Marker key={`edge-${i}`} coordinate={{ latitude: out.lat, longitude: out.lng }}>
                            <MapLabel text={`${Math.round(metersBetweenLL(p, next))} m`} />
                          </Marker>
                        );
                      })
                    : null}
                  {s.geofence && s.geofence.length >= 3
                    ? [(() => {
                        const c = polygonCentroid(s.geofence);
                        return (
                          <Marker key="area" coordinate={{ latitude: c.lat, longitude: c.lng }}>
                            <MapLabel text={`${Math.round(polygonAreaSqm(s.geofence)).toLocaleString('pt-BR')} m²`} tone="area" />
                          </Marker>
                        );
                      })()]
                    : null}
                  {s.geo && !(s.geofence && s.geofence.length >= 3) ? (
                    <Marker coordinate={{ latitude: s.geo.lat, longitude: s.geo.lng }}>
                      <MapPin color={t.colors.accent} active={running} />
                    </Marker>
                  ) : null}
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr('field.startVisit')}
                onPress={() => confirm(() => fieldApi.startSite(s.id))}
                style={{ backgroundColor: t.colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                <Text weight="800" style={{ fontSize: 15, color: '#fff' }}>{tr('field.startVisit')}</Text>
                <Icon name="chevronsR" size={17} color="#fff" />
              </Pressable>
            )}
          </SafeAreaView>
        </>
      )}
    </View>
  );
}
