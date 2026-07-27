import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, Icon, IconName, Row, SlideToConfirm, Text, useAuth, useTheme } from '@chamafacil/shared';
import { FieldShell, SECTION } from '../../src/field/FieldShell';
import { fieldApi } from '../../src/field/api';
import { ErrorState, Loading, useAsync } from '../../src/field/async';
import { OpenInMaps } from '../../src/field/OpenInMaps';
import { useMyLocation } from '../../src/location';

const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// minutes → "Xh Ymin" / "Ymin"
const humanMin = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}min` : `${Math.floor(m / 60)}h`);

/** Ticks every 30s so the shift duration stays live without churning. */
function useNowMinute() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Open-Meteo WMO weather code → emoji + label (free API, no key).
function weatherIcon(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: '☀️', label: 'Claro' };
  if (code <= 2) return { icon: '⛅', label: 'Parcialmente nublado' };
  if (code === 3) return { icon: '☁️', label: 'Nublado' };
  if (code === 45 || code === 48) return { icon: '🌫️', label: 'Neblina' };
  if (code >= 51 && code <= 67) return { icon: '🌧️', label: 'Chuva' };
  if (code >= 71 && code <= 77) return { icon: '❄️', label: 'Neve' };
  if (code >= 80 && code <= 82) return { icon: '🌦️', label: 'Pancadas' };
  if (code >= 95) return { icon: '⛈️', label: 'Tempestade' };
  return { icon: '🌡️', label: '' };
}

type Weather = { temp: number; icon: string; label: string };
/** Current weather at the device location (Open-Meteo). Null until it resolves. */
function useWeather(coords: { latitude: number; longitude: number } | null): Weather | null {
  const [w, setW] = useState<Weather | null>(null);
  const lat = coords?.latitude;
  const lng = coords?.longitude;
  useEffect(() => {
    if (lat == null || lng == null) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`);
        const j = await r.json();
        const cur = j?.current;
        if (alive && cur?.temperature_2m != null) setW({ temp: Math.round(cur.temperature_2m), ...weatherIcon(cur.weather_code) });
      } catch {
        /* offline / API down — just omit the chip */
      }
    })();
    return () => { alive = false; };
  }, [lat, lng]);
  return w;
}

/**
 * Field home — a day overview: shift (live duration + end), day progress, next
 * stop, today's routes summary, and shortcuts.
 */
export default function Dashboard() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { data: routes, loading, error, reload } = useAsync(() => fieldApi.routes(), []);
  const { data: shift, reload: reloadShift } = useAsync(() => fieldApi.shift(), []);
  const { user } = useAuth();
  const me = useMyLocation();
  const weather = useWeather(me);
  const firstName = (user?.name ?? '').trim().split(/\s+/)[0];
  const now = new Date();
  const nowMs = useNowMinute();
  const [endReset, setEndReset] = useState(0);
  const dateLabel = `${WD[now.getDay()]}, ${now.getDate()} ${MO[now.getMonth()]}`;

  const running = routes?.find((r) => r.status === 'running');
  const allStops = routes?.flatMap((r) => r.stops) ?? [];
  const doneStops = allStops.filter((s) => s.status === 'done').length;
  const totalStops = allStops.length;
  const totalKm = routes?.reduce((s, r) => s + r.km, 0) ?? 0;
  const progress = totalStops ? doneStops / totalStops : 0;
  const nextStop = allStops.find((s) => s.status === 'now') ?? allStops.find((s) => s.status === 'next');
  const shiftMinutes = shift?.startedAt ? Math.max(0, Math.round((nowMs - Date.parse(shift.startedAt)) / 60000)) : null;

  const endShift = async () => {
    try {
      await fieldApi.finishShift();
      reloadShift();
      reload();
    } catch (e) {
      Alert.alert(tr('field.endShiftError'), e instanceof ApiError ? e.message : String((e as Error)?.message ?? e));
      setEndReset((n) => n + 1);
    }
  };

  const card = { backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: t.colors.line, padding: 14, gap: 12 } as const;

  return (
    <FieldShell section="dashboard" title={tr('fieldNav.dashboard')} sub={dateLabel}>
      {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <View style={{ gap: 12, paddingTop: 2 }}>
          {/* Saudação + clima */}
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text weight="800" style={{ fontSize: 20, letterSpacing: -0.3 }} numberOfLines={1}>
              {firstName ? `${tr('field.greeting', { name: firstName })} 👋` : ''}
            </Text>
            {weather ? (
              <Row gap={6} style={{ alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: 999, borderWidth: 1, borderColor: t.colors.line, paddingHorizontal: 11, paddingVertical: 6 }}>
                <Text style={{ fontSize: 16 }}>{weather.icon}</Text>
                <Text weight="800" style={{ fontSize: 14, fontVariant: ['tabular-nums'] }}>{weather.temp}°C</Text>
              </Row>
            ) : null}
          </Row>

          {/* Turno */}
          <View style={card}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row gap={8} style={{ alignItems: 'center' }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: shift ? t.colors.ok : t.colors.ink3 }} />
                <Text weight="700" style={{ fontSize: 15 }}>{shift ? tr('field.shiftOn') : tr('field.shiftOff')}</Text>
              </Row>
              {shift ? (
                <Text variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
                  {shiftMinutes != null ? `${humanMin(shiftMinutes)} · ` : ''}{tr('field.crewN', { n: shift.crew?.length ?? 1 })}
                </Text>
              ) : null}
            </Row>
            {shift ? (
              <SlideToConfirm label={tr('field.endShift')} doneLabel={tr('field.endShiftDone')} confirmHint={tr('field.endShiftHint')} onConfirm={endShift} resetSignal={endReset} />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr('field.startTitle')}
                onPress={() => router.replace('/(field)/shift')}
                style={{ backgroundColor: t.colors.accent, borderRadius: 12, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Icon name="clock" size={18} color="#fff" />
                <Text weight="800" style={{ fontSize: 15 }} color="#fff">{tr('field.startTitle')}</Text>
              </Pressable>
            )}
          </View>

          {/* Progresso do dia */}
          {totalStops ? (
            <View style={card}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="label">{tr('field.dayProgress')}</Text>
                <Text weight="800" style={{ fontSize: 13, fontVariant: ['tabular-nums'] }} color={t.colors.ok}>{Math.round(progress * 100)}%</Text>
              </Row>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.surface2, overflow: 'hidden' }}>
                <View style={{ width: `${Math.round(progress * 100)}%`, height: '100%', backgroundColor: t.colors.ok, borderRadius: 4 }} />
              </View>
              <Text variant="caption">{tr('field.stopsDone', { done: doneStops, total: totalStops })}</Text>
            </View>
          ) : null}

          {/* Próxima parada */}
          {nextStop?.site ? (
            <View style={{ ...card, gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${tr('field.nextStop')}: ${nextStop.site.name}`}
                onPress={() => router.push(`/(field)/site/${nextStop.siteId}`)}
                style={{ gap: 8 }}
              >
                <Row gap={8} style={{ alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SECTION.sites.accent }} />
                  <Text variant="label">{tr('field.nextStop')}</Text>
                </Row>
                <Row gap={11} style={{ alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text weight="700" style={{ fontSize: 15 }}>{nextStop.site.name}</Text>
                    <Text variant="caption">{nextStop.site.address}</Text>
                  </View>
                  <Icon name="chevronsR" size={17} color={t.colors.ink3} />
                </Row>
              </Pressable>
              {/* Abrir a proxima parada num app de navegacao. */}
              <OpenInMaps address={nextStop.site.address} />
            </View>
          ) : null}

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
