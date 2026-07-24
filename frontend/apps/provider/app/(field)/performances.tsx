import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { FieldShell } from '../../src/field/FieldShell';

type Status = 'done' | 'doing';
const PERFS: { id: string; siteId: string; site: string; day: 'today' | 'yesterday'; time: string; services: number; crew: number; status: Status }[] = [
  { id: 'p1', siteId: 'rio-fortore', site: 'Cond. Rio Fortore', day: 'today', time: '8:33', services: 4, crew: 3, status: 'done' },
  { id: 'p2', siteId: 'solar', site: 'Ed. Solar das Palmeiras', day: 'today', time: '9:58', services: 2, crew: 2, status: 'doing' },
  { id: 'p3', siteId: 'villa', site: 'Cond. Villa Toscana', day: 'yesterday', time: '16:10', services: 3, crew: 2, status: 'done' },
  { id: 'p4', siteId: 'anavec', site: 'Ed. Anavec', day: 'yesterday', time: '11:05', services: 3, crew: 3, status: 'done' },
];

export default function Performances() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const done = PERFS.filter((p) => p.status === 'done').length;

  return (
    <FieldShell title={tr('fieldNav.performances')} sub={tr('field.perfCount', { done, total: PERFS.length })}>
      <View style={{ gap: 10, paddingTop: 2 }}>
        {PERFS.map((p) => {
          const isDone = p.status === 'done';
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={p.site}
              onPress={() => router.push(`/(field)/os/${p.siteId}`)}
              style={{ backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: t.colors.line, padding: 14, gap: 8 }}
            >
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="700" style={{ fontSize: 15 }}>{p.site}</Text>
                  <Text variant="caption">{tr(p.day === 'today' ? 'field.today' : 'field.yesterday')} · {p.time}</Text>
                </View>
                <View style={{ backgroundColor: isDone ? t.colors.okSoft : t.colors.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700' }} color={isDone ? t.colors.ok : t.colors.accent}>
                    {isDone ? tr('field.statusDone') : tr('field.statusDoing')}
                  </Text>
                </View>
              </Row>
              <Row gap={14}>
                <Row gap={6} style={{ alignItems: 'center' }}>
                  <Icon name="check" size={14} color={t.colors.ink3} />
                  <Text variant="caption">{tr('field.services', { n: p.services })}</Text>
                </Row>
                <Row gap={6} style={{ alignItems: 'center' }}>
                  <Icon name="user" size={14} color={t.colors.ink3} />
                  <Text variant="caption">{tr('field.crewN', { n: p.crew })}</Text>
                </Row>
              </Row>
            </Pressable>
          );
        })}
      </View>
    </FieldShell>
  );
}
