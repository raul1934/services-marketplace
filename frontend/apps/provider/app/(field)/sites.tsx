import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { FieldShell } from '../../src/field/FieldShell';
import { mandatoryServices, orderedSites } from '../../src/field/data';

export default function Sites() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const sites = orderedSites();

  return (
    <FieldShell title={tr('fieldNav.sites')} sub={tr('field.sitesCount', { n: sites.length })}>
      <View style={{ gap: 10, paddingTop: 2 }}>
        {sites.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={s.name}
            onPress={() => router.push(`/(field)/site/${s.id}`)}
            style={{ backgroundColor: t.colors.surface, borderRadius: 14, borderWidth: 1, borderColor: t.colors.line, padding: 14, gap: 6 }}
          >
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text weight="700" style={{ fontSize: 15 }}>{s.name}</Text>
                <Text variant="caption">{tr('field.contract', { name: s.contract })}</Text>
              </View>
              <Icon name="chevronsR" size={16} color={t.colors.ink3} />
            </Row>
            <Row gap={6} style={{ alignItems: 'center' }}>
              <Icon name="location" size={13} color={t.colors.ink3} />
              <Text variant="caption" style={{ flex: 1 }}>{s.address}</Text>
            </Row>
            <Row gap={7} style={{ marginTop: 2 }}>
              <Badge label={tr('field.services', { n: s.services.length })} />
              <Badge label={tr('field.required', { n: mandatoryServices(s).length })} tone="must" />
            </Row>
          </Pressable>
        ))}
      </View>
    </FieldShell>
  );
}

function Badge({ label, tone }: { label: string; tone?: 'must' }) {
  const t = useTheme();
  const must = tone === 'must';
  return (
    <View style={{ backgroundColor: t.colors.surface2, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '700' }} color={must ? t.colors.warn : t.colors.ink2}>{label}</Text>
    </View>
  );
}
