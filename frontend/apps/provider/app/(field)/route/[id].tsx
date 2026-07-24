import React from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Button, Icon, Row, Text, useTheme } from '@chamafacil/shared';

type Status = 'now' | 'next' | 'done';
const ROUTE_NAMES: Record<string, string> = { 'centro-norte': 'Centro–Norte', sul: 'Sul' };

const STOPS: { id: string; site: string; contract: string; address: string; km: string; services: string[]; required: number; status: Status; here?: string }[] = [
  { id: 'villa', site: 'Cond. Villa Toscana', contract: 'Pacco', address: 'R. Cel. Spínola de Castro, 3100', km: '0,0', services: ['Elevador', 'Portão'], required: 1, status: 'done' },
  { id: 'rio-fortore', site: 'Cond. Rio Fortore', contract: 'Nadruz', address: 'R. Patrícia R. Fontes, 805', km: '1,2', services: ["Bomba d'água", 'Quadro elétrico', 'Portão'], required: 2, status: 'now', here: '11 min' },
  { id: 'solar', site: 'Ed. Solar das Palmeiras', contract: 'Pacco', address: 'Av. Bady Bassitt, 3200', km: '3,8', services: ['Gerador', 'Ar-condicionado'], required: 1, status: 'next' },
  { id: 'anavec', site: 'Ed. Anavec', contract: 'Nadruz', address: 'R. Silva Jardim, 890', km: '5,1', services: ['Quadro geral', 'Iluminação'], required: 1, status: 'next' },
];

export default function RouteStops() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routeName = ROUTE_NAMES[id ?? ''] ?? tr('fieldNav.routes');
  const done = STOPS.filter((s) => s.status === 'done').length;
  const nextStop = STOPS.find((s) => s.status === 'now') ?? STOPS.find((s) => s.status === 'next');

  const openMaps = (kind: 'waze' | 'gmaps') => {
    const dest = encodeURIComponent(nextStop?.address ?? '');
    const url = kind === 'waze' ? `https://waze.com/ul?q=${dest}&navigate=yes` : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <BackBar title={`${tr('fieldNav.routes')} · ${routeName}`} onBack={() => router.back()} backLabel={tr('field.back')} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Text variant="caption">{tr('field.routeProgress', { done, total: STOPS.length })}</Text>

        <Row gap={10}>
          <View style={{ flex: 1 }}><Button title="Waze" variant="soft" full left={<Icon name="navigate" size={16} color={t.colors.accent} />} onPress={() => openMaps('waze')} /></View>
          <View style={{ flex: 1 }}><Button title="Google Maps" variant="soft" full left={<Icon name="pin" size={16} color={t.colors.accent} />} onPress={() => openMaps('gmaps')} /></View>
        </Row>

        {STOPS.map((s) => {
          const isNow = s.status === 'now';
          const isDone = s.status === 'done';
          return (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              accessibilityLabel={s.site}
              onPress={() => router.push(`/(field)/os/${s.id}`)}
              style={{ backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: isNow ? t.colors.accent : t.colors.line, padding: 14, gap: 8, opacity: isDone ? 0.7 : 1 }}
            >
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="700" style={{ fontSize: 15 }}>{s.site}</Text>
                  <Text variant="caption">{tr('field.contract', { name: s.contract })}</Text>
                </View>
                <StatusPill status={s.status} />
              </Row>
              <Row gap={6} style={{ alignItems: 'center' }}>
                <Icon name="location" size={13} color={t.colors.ink3} />
                <Text variant="caption" style={{ flex: 1 }}>{s.address}</Text>
                <Text variant="caption" style={{ fontVariant: ['tabular-nums'] }}>{isNow && s.here ? tr('field.hereFor', { time: s.here }) : `${s.km} km`}</Text>
              </Row>
              <Row gap={6} style={{ flexWrap: 'wrap' }}>
                {s.services.map((sv, i) => (
                  <View key={sv} style={{ backgroundColor: i < s.required ? t.colors.accentSoft : t.colors.surface2, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600' }} color={i < s.required ? t.colors.accent : t.colors.ink2}>{sv}{i < s.required ? ' ·obr.' : ''}</Text>
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

function StatusPill({ status }: { status: Status }) {
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
