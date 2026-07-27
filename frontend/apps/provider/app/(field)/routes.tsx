import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { FieldShell } from '../../src/field/FieldShell';
import { fieldApi } from '../../src/field/api';
import { ErrorState, Loading, useAsync } from '../../src/field/async';

const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function Routes() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { data: routes, loading, error, reload } = useAsync(() => fieldApi.routes(), []);
  const now = new Date();
  const dateLabel = `${WD[now.getDay()]}, ${now.getDate()} ${MO[now.getMonth()]}`;

  return (
    <FieldShell section="routes" title={tr('field.routesToday')} sub={routes ? `${dateLabel} · ${tr('field.routesCount', { n: routes.length })}` : dateLabel}>
      {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <View style={{ gap: 12, paddingTop: 2 }}>
          {routes!.map((r) => {
            const running = r.status === 'running';
            const preview = r.stops.slice(0, 3).map((st) => st.site?.name ?? st.siteId);
            return (
              <Pressable
                key={r.id}
                accessibilityRole="button"
                accessibilityLabel={r.name}
                onPress={() => router.push(`/(field)/route/${r.id}`)}
                style={{ backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: running ? t.colors.accent : t.colors.line, padding: 14, gap: 10 }}
              >
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text weight="700" style={{ fontSize: 15.5 }}>{r.name}</Text>
                  <Row gap={6} style={{ alignItems: 'center' }}>
                    <Pill tone={running ? 'accent' : 'mut'} label={running ? tr('field.next') : tr('field.scheduled')} />
                    <Icon name="chevronsR" size={16} color={t.colors.ink3} />
                  </Row>
                </Row>
                <Text variant="caption">{tr('field.stops', { n: r.stops.length })} · {tr('field.required', { n: r.required })} · {r.km} km{r.performedTimes > 0 ? ` · ${tr('field.doneTimes', { n: r.performedTimes })}` : ''}</Text>
                <Row gap={6} style={{ flexWrap: 'wrap' }}>
                  {preview.map((name) => <Tag key={name} label={name} />)}
                  {r.stops.length > preview.length ? <Tag label={`+${r.stops.length - preview.length}`} muted /> : null}
                </Row>
              </Pressable>
            );
          })}
        </View>
      )}
    </FieldShell>
  );
}

function Pill({ label, tone }: { label: string; tone: 'accent' | 'mut' }) {
  const t = useTheme();
  const accent = tone === 'accent';
  return (
    <View style={{ backgroundColor: accent ? t.colors.accentSoft : t.colors.surface2, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10.5, fontWeight: '700' }} color={accent ? t.colors.accent : t.colors.ink3}>{label}</Text>
    </View>
  );
}

function Tag({ label, muted }: { label: string; muted?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: t.colors.surface2, borderWidth: muted ? 0 : 1, borderColor: t.colors.line, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '600' }} color={muted ? t.colors.ink3 : t.colors.ink2}>{label}</Text>
    </View>
  );
}
