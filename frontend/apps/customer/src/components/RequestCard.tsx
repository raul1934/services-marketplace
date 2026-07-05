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
} from '@walvee/shared';
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
  return (
    <Card onPress={onPress} style={{ gap: 10 }}>
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
            {request.category ? tr(`categories.${request.category.slug}`, { defaultValue: request.category.name }) : tr('requestDetail.fallbackTitle')}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {request.address ?? request.description}
          </Text>
        </View>
        <Badge
          label={tr(`enums.requestStatus.${request.status}`)}
          tone={TONE[request.status] ?? 'neutral'}
          dot={request.status === RequestStatus.InProgress}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption">
          {request.urgency === RequestUrgency.Urgent
            ? tr('enums.urgency.urgent')
            : tr('enums.urgency.scheduled')}{' '}
          · {tr('requestCard.proposals', { count: request.proposals_count ?? 0 })}
        </Text>
        {request.budget_max != null && (
          <Text variant="label" color={t.colors.accent}>
            {tr('requestCard.upTo', { value: brl(request.budget_max) })}
          </Text>
        )}
      </View>
    </Card>
  );
}
