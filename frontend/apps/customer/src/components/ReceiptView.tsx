import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Card, Icon, Row, Settlement, Text, brl, useTheme } from '@chamafacil/shared';

/**
 * Payment receipt for a completed job — the settlement breakdown + the settled
 * date / receipt number. Rendered inline on the request detail (no header) and
 * standalone on the /receipt route (with the success header). Returns null when
 * there's no settlement yet.
 */
export function ReceiptView({
  request,
  header,
}: {
  request: { settlement?: Settlement | null; category?: { slug: string; name: string } | null; completed_at?: string | null };
  header?: boolean;
}) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const s = request.settlement;
  if (!s) return null;

  const settledAt = s.settled_at ?? request.completed_at;
  const settledLabel = settledAt
    ? new Date(settledAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <View style={{ gap: 16 }}>
      {header && (
        <View style={{ alignItems: 'center', gap: 10, paddingTop: 8 }}>
          <LinearGradient
            colors={t.grad as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' }, t.shadowSm]}
          >
            <Icon name="check" size={34} color="#fff" />
          </LinearGradient>
          <Text variant="h2" center>{tr('receipt.paidTitle')}</Text>
          {request.category && <Text variant="caption" center>{tr(`categories.${request.category.slug}`, { defaultValue: request.category.name })}</Text>}
        </View>
      )}

      <Card style={{ gap: 12 }}>
        <KV label={tr('receipt.labor')} value={brl(s.labor)} />
        {s.parts_total > 0 && <KV label={tr('receipt.parts')} value={brl(s.parts_total)} />}
        {s.surcharges_total > 0 && <KV label={tr('receipt.surcharges')} value={brl(s.surcharges_total)} />}
        <View style={{ height: 1, backgroundColor: t.colors.line }} />
        <Row>
          <Text weight="800" style={{ flex: 1, fontSize: 16 }}>{tr('receipt.total')}</Text>
          <Text weight="800" style={{ fontSize: 18, color: t.colors.accent }}>{brl(s.total)}</Text>
        </Row>
        {s.payment_method && (
          <Row gap={8}>
            <Icon name={s.payment_method} size={16} color={t.colors.ink3} />
            <Text variant="caption" weight="700" style={{ flex: 1 }}>{tr('receipt.method')}</Text>
            <Text weight="700" style={{ fontSize: 13.5 }}>{tr(`payment.${s.payment_method}`)}</Text>
          </Row>
        )}
      </Card>

      <View style={{ alignItems: 'center', gap: 3 }}>
        {settledLabel && <Text variant="caption" color={t.colors.ink3}>{tr('receipt.settledOn', { date: settledLabel })}</Text>}
        {s.receipt_no && <Text variant="caption" weight="700" color={t.colors.ink3}>{s.receipt_no}</Text>}
      </View>
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <Row>
      <Text variant="caption" weight="700" style={{ flex: 1 }}>{label}</Text>
      <Text weight="700" style={{ fontSize: 14 }}>{value}</Text>
    </Row>
  );
}
