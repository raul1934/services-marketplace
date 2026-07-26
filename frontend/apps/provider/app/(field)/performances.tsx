import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { FieldShell } from '../../src/field/FieldShell';
import { fieldApi } from '../../src/field/api';
import { ErrorState, Loading, useAsync } from '../../src/field/async';

export default function Performances() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { data: perfs, loading, error, reload } = useAsync(() => fieldApi.performances(), []);
  const done = perfs?.filter((p) => p.status === 'done').length ?? 0;

  return (
    <FieldShell title={tr('fieldNav.performances')} sub={perfs ? tr('field.perfCount', { done, total: perfs.length }) : undefined}>
      {loading ? <Loading /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <View style={{ gap: 10, paddingTop: 2 }}>
          {perfs!.map((p) => {
            const isDone = p.status === 'done';
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={p.siteName}
                onPress={() => router.push(`/(field)/os/${p.siteId}`)}
                style={{ backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: t.colors.line, padding: 14, gap: 8 }}
              >
                <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text weight="700" style={{ fontSize: 15 }}>{p.siteName}</Text>
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
      )}
    </FieldShell>
  );
}
