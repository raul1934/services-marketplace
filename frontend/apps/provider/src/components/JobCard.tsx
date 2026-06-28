import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, Card, RequestStatus, RequestUrgency, ServiceRequest, Text, brl, distanceLabel, useTheme } from '@walvee/shared';
import { CategoryIcon } from './CategoryIcon';

/** Request card for the provider side — nearby open requests, bids and jobs. */
export function JobCard({
  request,
  onPress,
  showDistance,
}: {
  request: ServiceRequest;
  onPress: () => void;
  showDistance?: boolean;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const isOpen = request.status === RequestStatus.Open;
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
            {request.category?.name ?? tr('job.fallbackTitle')}
          </Text>
          <Text variant="caption" numberOfLines={1}>
            {request.description}
          </Text>
        </View>
        {request.urgency === RequestUrgency.Urgent ? (
          <Badge label={tr('enums.urgency.urgent')} tone="urgent" />
        ) : (
          <Badge label={tr(`enums.requestStatus.${request.status}`)} tone={isOpen ? 'open' : 'live'} />
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption">
          {showDistance && request.distance_km != null ? `📍 ${distanceLabel(request.distance_km)}` : request.address ?? '—'}
        </Text>
        {request.my_proposal ? (
          <Text variant="label" color={t.colors.accent}>
            {tr('jobCard.yourBid', { value: brl(request.my_proposal.price) })}
          </Text>
        ) : request.budget_max != null ? (
          <Text variant="label" color={t.colors.ink2}>
            {tr('jobCard.upTo', { value: brl(request.budget_max) })}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
