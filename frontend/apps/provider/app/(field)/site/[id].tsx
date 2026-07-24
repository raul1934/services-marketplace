import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Button, Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { mandatoryServices, SITES } from '../../../src/field/data';

export default function SiteDetail() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = SITES[id ?? ''] ?? SITES['rio-fortore'];
  const mandatory = mandatoryServices(s);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <BackBar title={s.name} onBack={() => router.back()} backLabel={tr('field.back')} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: t.colors.line, padding: 14, gap: 8 }}>
          <Text variant="caption">{tr('field.contract', { name: s.contract })}</Text>
          <Row gap={6} style={{ alignItems: 'center' }}>
            <Icon name="location" size={14} color={t.colors.ink3} />
            <Text style={{ flex: 1, fontSize: 13.5 }} color={t.colors.ink2}>{s.address}</Text>
          </Row>
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="label">{tr('field.siteMandatory')}</Text>
          <View style={{ backgroundColor: t.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: t.colors.line }}>
            {mandatory.length ? mandatory.map((m, i) => (
              <Row key={m.id} gap={10} style={{ paddingHorizontal: 13, paddingVertical: 11, alignItems: 'center', borderTopWidth: i === 0 ? 0 : 1, borderTopColor: t.colors.line }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent }} />
                <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '600' }}>{m.name}</Text>
                <Text style={{ fontSize: 10.5, fontWeight: '700' }} color={t.colors.ink2}>{m.rate === 'hour' ? tr('field.rateHour') : tr('field.rateVisit')}</Text>
              </Row>
            )) : (
              <Text variant="caption" style={{ padding: 13 }}>{tr('field.noneMandatory')}</Text>
            )}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="label">{tr('field.history')}</Text>
          {s.history.length ? s.history.map((h) => (
            <Pressable
              key={h.id}
              accessibilityRole="button"
              onPress={() => router.push(`/(field)/os/${s.id}`)}
              style={{ backgroundColor: t.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: t.colors.line, padding: 13 }}
            >
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text weight="700" style={{ fontSize: 13.5 }}>{tr(h.day === 'today' ? 'field.today' : 'field.yesterday')} · {h.time}</Text>
                  <Text variant="caption">{tr('field.services', { n: h.services })}</Text>
                </View>
                <View style={{ backgroundColor: h.status === 'done' ? t.colors.okSoft : t.colors.accentSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700' }} color={h.status === 'done' ? t.colors.ok : t.colors.accent}>{h.status === 'done' ? tr('field.statusDone') : tr('field.statusDoing')}</Text>
                </View>
              </Row>
            </Pressable>
          )) : (
            <Text variant="caption">{tr('field.noHistory')}</Text>
          )}
        </View>

        <Button title={tr('field.openOS')} full onPress={() => router.push(`/(field)/os/${s.id}`)} right={<Icon name="arrowR" size={18} color={t.colors.accentInk} />} />
      </ScrollView>
    </View>
  );
}
