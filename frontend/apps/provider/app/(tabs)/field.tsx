import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Icon, Row, Screen, Text, useTheme } from '@chamafacil/shared';

/**
 * Home of the field-service experience (the `field_service` flag). Placeholder
 * for now: the real flow — start shift, pick route, work the service order at a
 * site (geofence, photos, equipment, materials, crew) — lands here as it is
 * built. See docs/b2b-arquitetura-referencia-yeti.md and the field prototype.
 */
export default function Field() {
  const t = useTheme();
  const { t: tr } = useTranslation();

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 16 }}>
        <Row gap={12}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="wrench" size={22} color={t.colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="800" style={{ fontSize: 20, letterSpacing: -0.3 }}>{tr('field.title')}</Text>
            <Text variant="caption">{tr('field.subtitle')}</Text>
          </View>
        </Row>

        <Card style={{ gap: 10 }}>
          <Row gap={9}>
            <Icon name="clock" size={18} color={t.colors.ink3} />
            <Text style={{ flex: 1, fontSize: 13.5, fontWeight: '600' }} color={t.colors.ink2}>{tr('field.soon')}</Text>
          </Row>
        </Card>
      </View>
    </Screen>
  );
}
