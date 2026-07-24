import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Row, Text, useTheme } from '@chamafacil/shared';
import { FieldShell } from '../../src/field/FieldShell';

const SITES: { id: string; name: string; contract: string; address: string; services: number; required: number }[] = [
  { id: 'rio-fortore', name: 'Cond. Rio Fortore', contract: 'Nadruz', address: 'Av. Anísio Haddad, 2000', services: 3, required: 2 },
  { id: 'solar', name: 'Ed. Solar das Palmeiras', contract: 'Pacco', address: 'Av. Bady Bassitt, 3200', services: 2, required: 1 },
  { id: 'villa', name: 'Cond. Villa Toscana', contract: 'Pacco', address: 'R. Cel. Spínola de Castro, 3100', services: 2, required: 1 },
  { id: 'anavec', name: 'Ed. Anavec', contract: 'Nadruz', address: 'R. Silva Jardim, 890', services: 2, required: 1 },
];

export default function Sites() {
  const t = useTheme();
  const { t: tr } = useTranslation();

  return (
    <FieldShell title={tr('fieldNav.sites')} sub={tr('field.sitesCount', { n: SITES.length })}>
      <View style={{ gap: 10, paddingTop: 2 }}>
        {SITES.map((s) => (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={s.name}
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
              <Badge label={tr('field.services', { n: s.services })} />
              <Badge label={tr('field.required', { n: s.required })} tone="must" />
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
