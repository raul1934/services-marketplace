import React from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Button, Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { ROUTES, SITES, StopStatus } from '../../../src/field/data';

const shortName = (serviceName: string) => serviceName.split(' — ')[0];

export default function RouteStops() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const route = ROUTES[id ?? ''] ?? ROUTES['centro-norte'];
  const done = route.stops.filter((s) => s.status === 'done').length;
  const nextStop = route.stops.find((s) => s.status === 'now') ?? route.stops.find((s) => s.status === 'next');

  const openMaps = (kind: 'waze' | 'gmaps') => {
    const dest = encodeURIComponent(nextStop ? SITES[nextStop.siteId].address : '');
    const url = kind === 'waze' ? `https://waze.com/ul?q=${dest}&navigate=yes` : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <BackBar title={`${tr('fieldNav.routes')} · ${route.name}`} onBack={() => router.back()} backLabel={tr('field.back')} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Text variant="caption">{tr('field.routeProgress', { done, total: route.stops.length })}</Text>

        <Row gap={10}>
          <View style={{ flex: 1 }}><Button title="Waze" variant="soft" full left={<Icon name="navigate" size={16} color={t.colors.accent} />} onPress={() => openMaps('waze')} /></View>
          <View style={{ flex: 1 }}><Button title="Google Maps" variant="soft" full left={<Icon name="pin" size={16} color={t.colors.accent} />} onPress={() => openMaps('gmaps')} /></View>
        </Row>

        {route.stops.map((stop) => {
          const site = SITES[stop.siteId];
          const isNow = stop.status === 'now';
          const isDone = stop.status === 'done';
          return (
            <Pressable
              key={stop.siteId}
              accessibilityRole="button"
              accessibilityLabel={site.name}
              onPress={() => router.push(`/(field)/os/${stop.siteId}`)}
              style={{ backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: isNow ? t.colors.accent : t.colors.line, padding: 14, gap: 8, opacity: isDone ? 0.7 : 1 }}
            >
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="700" style={{ fontSize: 15 }}>{site.name}</Text>
                  <Text variant="caption">{tr('field.contract', { name: site.contract })}</Text>
                </View>
                <StatusPill status={stop.status} />
              </Row>
              <Row gap={6} style={{ alignItems: 'center' }}>
                <Icon name="location" size={13} color={t.colors.ink3} />
                <Text variant="caption" style={{ flex: 1 }}>{site.address}</Text>
                <Text variant="caption" style={{ fontVariant: ['tabular-nums'] }}>{isNow && stop.here ? tr('field.hereFor', { time: stop.here }) : `${stop.km} km`}</Text>
              </Row>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {site.services.map((sv) => (
                  <View key={sv.id} style={{ backgroundColor: sv.obrig ? t.colors.accentSoft : t.colors.surface2, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600' }} color={sv.obrig ? t.colors.accent : t.colors.ink2}>{shortName(sv.name)}{sv.obrig ? ' ·obr.' : ''}</Text>
                  </View>
                ))}
              </Row>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StatusPill({ status }: { status: StopStatus }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const map = {
    now: { bg: t.colors.accentSoft, fg: t.colors.accent, label: tr('field.stopNow') },
    next: { bg: t.colors.surface2, fg: t.colors.ink3, label: tr('field.stopNext') },
    done: { bg: t.colors.okSoft, fg: t.colors.ok, label: tr('field.stopDone') },
  }[status];
  return (
    <View style={{ backgroundColor: map.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700' }} color={map.fg}>{map.label}</Text>
    </View>
  );
}
