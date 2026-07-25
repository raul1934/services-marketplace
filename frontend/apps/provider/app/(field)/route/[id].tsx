import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import MapView, { MapPin, Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Icon, Row, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';
import { ROUTES, routeStatus, SITE_GEO, SITES, StopStatus } from '../../../src/field/data';
import { OpenInMaps } from '../../../src/field/OpenInMaps';

function fitRegion(pts: { lat: number; lng: number }[]): Region {
  const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.02),
  };
}

const toneColor = (t: ReturnType<typeof useTheme>, s: StopStatus) => (s === 'done' ? t.colors.ok : s === 'now' ? t.colors.accent : t.colors.ink3);

export default function RouteStops() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const route = ROUTES[id ?? ''] ?? ROUTES['centro-norte'];
  const [running, setRunning] = useState(routeStatus(route.id) === 'running');

  const stops = route.stops.map((s, i) => ({ ...s, site: SITES[s.siteId], geo: SITE_GEO[s.siteId], n: i + 1 }));
  const region = fitRegion(stops.map((s) => s.geo).filter(Boolean));
  const dest = stops.find((s) => s.status === 'now') ?? stops.find((s) => s.status === 'next') ?? stops[0];

  // Recenter to fit all points after 5s without the user touching the map.
  const mapRef = useRef<MapView>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRecenter = () => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = setTimeout(() => mapRef.current?.animateToRegion(region, 600), 5000);
  };
  useEffect(() => () => { if (idle.current) clearTimeout(idle.current); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <BackBar title={tr('fieldNav.routes')} onBack={() => router.back()} backLabel={tr('field.back')} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text weight="800" style={{ fontSize: 24, letterSpacing: -0.4 }}>{route.name}</Text>
          <Text variant="caption">{tr('field.stops', { n: route.stops.length })} · {route.km} km · {running ? tr('field.statusDoing') : tr('field.stopNext')}</Text>
        </View>

        <View style={{ marginHorizontal: 20, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.line }}>
          <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={region} onPanDrag={scheduleRecenter}>
            {stops.map((s) => (s.geo ? (
              <Marker
                key={s.siteId}
                coordinate={{ latitude: s.geo.lat, longitude: s.geo.lng }}
                onPress={() => router.push(`/(field)/os/${s.siteId}`)}
              >
                <MapPin number={s.n} color={toneColor(t, s.status)} active={s.status === 'now'} />
              </Marker>
            ) : null))}
          </MapView>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <OpenInMaps address={dest ? dest.site.address : route.name} />
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
          <Text variant="label">{tr('field.routeSites')}</Text>
          {stops.map((s) => {
            const label = s.status === 'done' ? tr('field.times', { n: s.times ?? 1 }) : s.status === 'now' ? tr('field.inProgress') : tr('field.stopNext');
            return (
              <Pressable
                key={s.siteId}
                accessibilityRole="button"
                accessibilityLabel={s.site.name}
                onPress={() => router.push(`/(field)/os/${s.siteId}`)}
                style={{ backgroundColor: t.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: s.status === 'now' ? t.colors.accent : t.colors.line, padding: 12 }}
              >
                <Row gap={11} style={{ alignItems: 'center' }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: toneColor(t, s.status), alignItems: 'center', justifyContent: 'center' }}>
                    <Text weight="800" style={{ fontSize: 12.5, color: '#fff' }}>{s.n}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text weight="700" style={{ fontSize: 14 }}>{s.site.name}</Text>
                    <Text variant="caption">{s.site.address}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700' }} color={toneColor(t, s.status)}>{label}</Text>
                  <Icon name="chevronsR" size={15} color={t.colors.ink3} />
                </Row>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, borderTopWidth: 1, borderTopColor: t.colors.line, backgroundColor: t.colors.surface }}>
        {running ? (
          <SlideToConfirm variant="success" label={tr('field.finishRoute')} doneLabel={tr('field.finishRouteDone')} confirmHint={tr('field.finishRouteHint')} onConfirm={() => setRunning(false)} />
        ) : (
          <SlideToConfirm label={tr('field.startRoute')} doneLabel={tr('field.startRouteDone')} confirmHint={tr('field.startRouteHint')} onConfirm={() => setRunning(true)} />
        )}
      </SafeAreaView>
    </View>
  );
}
