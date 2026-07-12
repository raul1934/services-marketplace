import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Icon,
  IconName,
  RequestEvent,
  RequestEventType,
  Row,
  SectionLabel,
  Text,
  brl,
  relativeParts,
  useTheme,
} from '@chamafacil/shared';

/** How many events are visible before the feed is expanded. */
const COLLAPSED = 5;

const ICONS: Record<RequestEventType, IconName> = {
  request_created: 'sparkles',
  proposal_received: 'mail',
  proposal_accepted: 'check',
  job_started: 'navigate',
  parts_approval_requested: 'shieldCheck',
  parts_approved: 'check',
  part_added: 'wrench',
  surcharge_proposed: 'flash',
  surcharge_resolved: 'dollar',
  requote: 'edit',
  reschedule_requested: 'calendar',
  reschedule_resolved: 'calendar',
  job_update: 'camera',
  job_completed: 'check',
  cancelled: 'close',
  no_show: 'clock',
  expired: 'clock',
  disputed: 'shield',
  review_submitted: 'star',
};

/**
 * Bottom-pinned activity feed for a request: the approved value plus the
 * request's events. Collapsed it shows the {COLLAPSED} most recent (latest at
 * the bottom, growing upward); tapping "view all" expands to the full list.
 * Events arrive ascending (oldest → newest), so `slice(-N)` keeps the latest.
 */
export function EventFeed({ events, approvedValue }: { events: RequestEvent[]; approvedValue?: number | null }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!events.length) return null;

  const hidden = Math.max(0, events.length - COLLAPSED);
  const visible = expanded ? events : events.slice(-COLLAPSED);

  const timeLabel = (iso: string) => {
    const { unit, count } = relativeParts(iso);
    return unit === 'now' ? tr('time.now') : tr(`time.${unit}Ago`, { count });
  };

  return (
    <View style={{ gap: 10 }}>
      <Row>
        <SectionLabel count={events.length}>{tr('eventFeed.title')}</SectionLabel>
        <View style={{ flex: 1 }} />
        {approvedValue != null && (
          <Text variant="caption" weight="700">
            {tr('eventFeed.approvedValue')} · {brl(approvedValue)}
          </Text>
        )}
      </Row>

      <Card style={{ gap: 14 }}>
        {visible.map((e) => {
          const caption = captionOf(e);
          return (
            <Row key={e.id} style={{ alignItems: 'flex-start' }} gap={12}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  backgroundColor: t.colors.accentSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 1,
                }}
              >
                <Icon name={ICONS[e.type]} size={15} color={t.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="700" style={{ fontSize: 13.5 }}>
                  {tr(`eventFeed.types.${e.type}`)}
                  {e.amount != null ? ` · ${brl(e.amount)}` : ''}
                </Text>
                {caption ? (
                  <Text variant="caption" numberOfLines={1}>
                    {caption}
                  </Text>
                ) : null}
              </View>
              <Text variant="caption" color={t.colors.ink3}>
                {timeLabel(e.at)}
              </Text>
            </Row>
          );
        })}

        {hidden > 0 && (
          <Text
            weight="700"
            center
            color={t.colors.accent}
            style={{ fontSize: 12.5, paddingTop: 2 }}
            onPress={() => setExpanded((v) => !v)}
          >
            {expanded ? tr('eventFeed.viewLess') : tr('eventFeed.viewAll', { count: events.length })}
          </Text>
        )}
      </Card>
    </View>
  );
}

/** Short, type-specific secondary line built from the event's `data`. */
function captionOf(e: RequestEvent): string {
  const d = (e.data ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof d[k] === 'string' ? (d[k] as string) : '');
  switch (e.type) {
    case 'proposal_received':
    case 'proposal_accepted':
      return str('provider_name');
    case 'part_added': {
      const qty = typeof d.quantity === 'number' ? d.quantity : 1;
      return qty > 1 ? `${str('name')} ×${qty}` : str('name');
    }
    case 'surcharge_proposed':
    case 'requote':
    case 'cancelled':
    case 'no_show':
      return str('reason');
    case 'job_update':
      return str('body');
    case 'review_submitted':
      return typeof d.rating === 'number' ? '★'.repeat(d.rating) : '';
    default:
      return '';
  }
}
