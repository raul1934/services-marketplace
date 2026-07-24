import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { FieldShell } from '../../src/field/FieldShell';

const ROUTES: { id: string; name: string; stops: number; required: number; km: number; preview: string[]; first?: boolean }[] = [
  { id: 'centro-norte', name: 'Centro–Norte', stops: 4, required: 6, km: 18, preview: ['Rio Fortore', 'Solar das Palmeiras', 'Villa Toscana'], first: true },
  { id: 'sul', name: 'Sul', stops: 3, required: 4, km: 12, preview: ['Ed. Anavec', 'Cond. Represa', 'Res. Damha'] },
];

const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function Routes() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const now = new Date();
  const dateLabel = `${WD[now.getDay()]}, ${now.getDate()} ${MO[now.getMonth()]}`;

  return (
    <FieldShell title={tr('field.routesToday')} sub={`${dateLabel} · ${tr('field.routesCount', { n: ROUTES.length })}`}>
      <View style={{ gap: 12, paddingTop: 2 }}>
        {ROUTES.map((r) => (
          <Pressable
            key={r.id}
            accessibilityRole="button"
            accessibilityLabel={r.name}
            onPress={() => router.push(`/(field)/route/${r.id}`)}
            style={{ backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: r.first ? t.colors.accent : t.colors.line, padding: 14, gap: 10 }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Text weight="700" style={{ fontSize: 15.5 }}>{r.name}</Text>
              <Row gap={6} style={{ alignItems: 'center' }}>
                <Pill tone={r.first ? 'accent' : 'mut'} label={r.first ? tr('field.next') : tr('field.scheduled')} />
                <Icon name="chevronsR" size={16} color={t.colors.ink3} />
              </Row>
            </Row>
            <Text variant="caption">{tr('field.stops', { n: r.stops })} · {tr('field.required', { n: r.required })} · {r.km} km</Text>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              {r.preview.map((s) => <Tag key={s} label={s} />)}
              {r.stops > r.preview.length ? <Tag label={`+${r.stops - r.preview.length}`} muted /> : null}
            </Row>
          </Pressable>
        ))}
      </View>
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
