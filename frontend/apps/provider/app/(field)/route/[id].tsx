import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import MapView, { MapPin, Marker, Polyline, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Icon, Row, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';
import { fieldApi, Geo, StopStatus } from '../../../src/field/api';
import { ErrorState, Loading, useAsync } from '../../../src/field/async';
import { OpenInMaps } from '../../../src/field/OpenInMaps';
import { useMyLocation } from '../../../src/location';

function fitRegion(pts: Geo[]): Region {
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
  const { data: route, loading, error, reload } = useAsync(() => fieldApi.route(id ?? 'centro-norte'), [id]);

  const mapRef = useRef<MapView>(null);
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentering = useRef(false);
  useEffect(() => () => { if (idle.current) clearTimeout(idle.current); }, []);

  const me = useMyLocation();
  const geoStops = (route?.stops ?? []).filter((s) => !!s.site?.geo);
  // Road-following path from OSRM when available; else straight stop-to-stop.
  const line = route?.geometry?.length
    ? route.geometry
    : geoStops.map((s) => ({ latitude: s.site!.geo!.lat, longitude: s.site!.geo!.lng }));
  // Fit the route plus the user's dot (so "you are here" is always in view).
  const geoPts = [
    ...geoStops.map((s) => s.site!.geo!),
    ...(me ? [{ lat: me.latitude, lng: me.longitude }] : []),
  ] as Geo[];
  const region = geoPts.length ? fitRegion(geoPts) : undefined;
  // Recenter to fit the whole route ~3s after the user stops panning/zooming.
  // Our own animateToRegion also settles the map, so a flag skips that echo.
  const onRegionSettled = () => {
    if (recentering.current) { recentering.current = false; return; }
    if (idle.current) clearTimeout(idle.current);
    if (region) idle.current = setTimeout(() => { recentering.current = true; mapRef.current?.animateToRegion(region, 500); }, 3000);
  };

  // Re-fit once when the GPS dot first arrives (initialRegion only applies on mount).
  const fittedMe = useRef(false);
  useEffect(() => {
    if (me && region && !fittedMe.current) {
      fittedMe.current = true;
      recentering.current = true;
      mapRef.current?.animateToRegion(region, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.latitude, me?.longitude]);
  const dest = route?.stops.find((s) => s.status === 'now') ?? route?.stops.find((s) => s.status === 'next') ?? route?.stops[0];
  const running = route?.status === 'running';

  const confirm = async (fn: () => Promise<unknown>) => {
    try { await fn(); } finally { reload(); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <BackBar title={tr('fieldNav.routes')} onBack={() => router.back()} backLabel={tr('field.back')} />
      </SafeAreaView>

      {loading ? <Loading /> : error || !route ? <ErrorState error={error ?? new Error()} onRetry={reload} /> : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text weight="800" style={{ fontSize: 24, letterSpacing: -0.4 }}>{route.name}</Text>
              <Text variant="caption">{tr('field.stops', { n: route.stops.length })} · {route.km} km · {running ? tr('field.statusDoing') : tr('field.stopNext')}</Text>
            </View>

            {region ? (
              <View style={{ marginHorizontal: 20, height: 220, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.line }}>
                <MapView ref={mapRef} style={{ flex: 1 }} initialRegion={region} onRegionChangeComplete={onRegionSettled}>
                  {line.length >= 2 ? <Polyline coordinates={line} strokeColor={t.colors.accent} strokeWidth={3} /> : null}
                  {me ? (
                    <Marker key="me" coordinate={me}>
                      <MapPin color="#1a73e8" active />
                    </Marker>
                  ) : null}
                  {route.stops.map((s, i) => (s.site?.geo ? (
                    <Marker
                      key={s.siteId}
                      coordinate={{ latitude: s.site.geo.lat, longitude: s.site.geo.lng }}
                      onPress={() => router.push(`/(field)/site/${s.siteId}`)}
                    >
                      <MapPin number={i + 1} color={toneColor(t, s.status)} active={s.status === 'now'} />
                    </Marker>
                  ) : null))}
                </MapView>
              </View>
            ) : null}

            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
              <OpenInMaps address={dest?.site?.address ?? route.name} />
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
              <Text variant="label">{tr('field.routeSites')}</Text>
              {route.stops.map((s, i) => {
                const label = s.status === 'done' ? tr('field.times', { n: s.times || 1 }) : s.status === 'now' ? tr('field.inProgress') : tr('field.stopNext');
                return (
                  <Pressable
                    key={s.siteId}
                    accessibilityRole="button"
                    accessibilityLabel={s.site?.name ?? s.siteId}
                    onPress={() => router.push(`/(field)/site/${s.siteId}`)}
                    style={{ backgroundColor: t.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: s.status === 'now' ? t.colors.accent : t.colors.line, padding: 12 }}
                  >
                    <Row gap={11} style={{ alignItems: 'center' }}>
                      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: toneColor(t, s.status), alignItems: 'center', justifyContent: 'center' }}>
                        <Text weight="800" style={{ fontSize: 12.5, color: '#fff' }}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text weight="700" style={{ fontSize: 14 }}>{s.site?.name ?? s.siteId}</Text>
                        <Text variant="caption">{s.site?.address ?? ''}</Text>
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
              <SlideToConfirm variant="success" label={tr('field.finishRoute')} doneLabel={tr('field.finishRouteDone')} confirmHint={tr('field.finishRouteHint')} onConfirm={() => confirm(() => fieldApi.finishRoute(route.id))} />
            ) : (
              <SlideToConfirm label={tr('field.startRoute')} doneLabel={tr('field.startRouteDone')} confirmHint={tr('field.startRouteHint')} onConfirm={() => confirm(() => fieldApi.startRoute(route.id))} />
            )}
          </SafeAreaView>
        </>
      )}
    </View>
  );
}
