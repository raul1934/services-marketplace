import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, IconName, Row, Text, useTheme } from '@chamafacil/shared';
import { FieldShell, SECTION } from '../../src/field/FieldShell';
import { fieldApi } from '../../src/field/api';
import { ErrorState, Loading, useAsync } from '../../src/field/async';

const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Field home — a day overview: shift status, today's routes summary (with a
 * resume for the running one), and shortcuts. Replaces the raw routes list as
 * the initial screen.
 */
export default function Dashboard() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { data: routes, loading, error, reload } = useAsync(() => fieldApi.routes(), []);
  const { data: shift } = useAsync(() => fieldApi.shift(), []);
  const now = new Date();
  const dateLabel = `${WD[now.getDay()]}, ${now.getDate()} ${MO[now.getMonth()]}`;

  const running = routes?.find((r) => r.status === 'running');
  const totalStops = routes?.reduce((s, r) => s + r.stops.length, 0) ?? 0;
  const totalKm = routes?.reduce((s, r) => s + r.km, 0) ?? 0;

  const card = { backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: t.colors.line, padding: 14, gap: 12 } as const;

  return (
    <FieldShell section="dashboard" title={tr('fieldNav.dashboard')} sub={dateLabel}>
      {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <View style={{ gap: 12, paddingTop: 2 }}>
          {/* Turno */}
          <View style={card}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row gap={8} style={{ alignItems: 'center' }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: shift ? t.colors.ok : t.colors.ink3 }} />
                <Text weight="700" style={{ fontSize: 15 }}>{shift ? tr('field.shiftOn') : tr('field.shiftOff')}</Text>
              </Row>
              {shift ? <Text variant="caption">{tr('field.crewN', { n: shift.crew?.length ?? 1 })}</Text> : null}
            </Row>
            {!shift ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr('field.startTitle')}
                onPress={() => router.replace('/(field)/shift')}
                style={{ backgroundColor: t.colors.accent, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icon name="clock" size={18} color="#fff" />
                <Text weight="800" style={{ fontSize: 15 }} color="#fff">{tr('field.startTitle')}</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Rotas de hoje */}
          <View style={card}>
            <Text variant="label">{tr('field.routesToday')}</Text>
            <Row gap={10} style={{ alignItems: 'stretch' }}>
              <Stat n={routes?.length ?? 0} label={tr('field.statRoutes')} />
              <Stat n={totalStops} label={tr('field.statStops')} />
              <Stat n={totalKm} label={tr('field.statKm')} />
            </Row>
            {running ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr('field.continueRoute', { name: running.name })}
                onPress={() => router.push(`/(field)/route/${running.id}`)}
                style={{ backgroundColor: SECTION.routes.accent, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Text weight="800" style={{ fontSize: 15 }} color="#fff">{tr('field.continueRoute', { name: running.name })}</Text>
                <Icon name="chevronsR" size={17} color="#fff" />
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr('field.viewRoutes')}
                onPress={() => router.replace('/(field)/routes')}
                style={{ backgroundColor: t.colors.accentSoft, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text weight="700" style={{ fontSize: 14 }} color={t.colors.accent}>{tr('field.viewRoutes')}</Text>
              </Pressable>
            )}
          </View>

          {/* Atalhos */}
          <Text variant="label" style={{ marginTop: 2 }}>{tr('field.shortcuts')}</Text>
          <Row gap={10} style={{ alignItems: 'stretch' }}>
            <Shortcut icon="navigate" color={SECTION.routes.accent} label={tr('fieldNav.routes')} onPress={() => router.replace('/(field)/routes')} />
            <Shortcut icon="location" color={SECTION.sites.accent} label={tr('fieldNav.sites')} onPress={() => router.replace('/(field)/sites')} />
            <Shortcut icon="list" color={SECTION.performances.accent} label={tr('fieldNav.performances')} onPress={() => router.replace('/(field)/performances')} />
          </Row>
        </View>
      )}
    </FieldShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface2, borderRadius: 11, paddingVertical: 10, alignItems: 'center', gap: 1 }}>
      <Text weight="800" style={{ fontSize: 20, fontVariant: ['tabular-nums'] }}>{n}</Text>
      <Text variant="caption">{label}</Text>
    </View>
  );
}

function Shortcut({ icon, color, label, onPress }: { icon: IconName; color: string; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ flex: 1, backgroundColor: t.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: t.colors.line, paddingVertical: 14, alignItems: 'center', gap: 7 }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: color + '1F', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} color={color} />
      </View>
      <Text weight="700" style={{ fontSize: 12.5 }}>{label}</Text>
    </Pressable>
  );
}
