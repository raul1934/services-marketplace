import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  BadgeTone,
  Card,
  RequestStatus,
  RequestUrgency,
  ServiceRequest,
  Text,
  brl,
  useTheme,
} from '@chamafacil/shared';
import { CategoryIcon } from './CategoryIcon';

const TONE: Record<string, BadgeTone> = {
  [RequestStatus.Open]: 'open',
  [RequestStatus.Accepted]: 'live',
  [RequestStatus.InProgress]: 'live',
  [RequestStatus.Completed]: 'ok',
  [RequestStatus.Cancelled]: 'urgent',
  [RequestStatus.Expired]: 'neutral',
};

export function RequestCard({ request, onPress }: { request: ServiceRequest; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const title = request.category
    ? tr(`categories.${request.category.slug}`, { defaultValue: request.category.name })
    : tr('requestDetail.fallbackTitle');
  const subtitle = request.address ?? request.description;
  const status = tr(`enums.requestStatus.${request.status}`);
  const urgency =
    request.urgency === RequestUrgency.Urgent ? tr('enums.urgency.urgent') : tr('enums.urgency.scheduled');
  const proposals = tr('requestCard.proposals', { count: request.proposals_count ?? 0 });
  const budget = request.budget_max != null ? tr('requestCard.upTo', { value: brl(request.budget_max) }) : null;
  // The card holds six independent fragments; read one by one (with the "·"
  // separators) they land as noise. Spell out the same information as one
  // sentence, in the order someone would say it out loud, and let Card announce
  // it as a button.
  const a11yLabel = [title, subtitle, status, urgency, proposals, budget].filter(Boolean).join(', ');

  return (
    <Card onPress={onPress} style={{ gap: 10 }} accessibilityLabel={a11yLabel}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: t.colors.surface2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CategoryIcon category={request.category} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h3" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Badge
          label={status}
          tone={TONE[request.status] ?? 'neutral'}
          dot={request.status === RequestStatus.InProgress}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption">
          {urgency} · {proposals}
        </Text>
        {budget != null && (
          <Text variant="label" color={t.colors.accent}>
            {budget}
          </Text>
        )}
      </View>
    </Card>
  );
}
