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
 * Activity feed for a request. Two shapes:
 *
 * - `feed` (default): the {COLLAPSED} most recent events, expandable. Used
 *   inline next to other content, where it must not dominate the screen.
 * - `table`: every event with a column header, no collapsing. Used on the
 *   History tab, where the list IS the content and scanning it by column
 *   (what happened · how much · when) is the point.
 *
 * Events arrive ascending (oldest → newest), so `slice(-N)` keeps the latest.
 */
export function EventFeed({
  events,
  approvedValue,
  variant = 'feed',
}: {
  events: RequestEvent[];
  approvedValue?: number | null;
  variant?: 'feed' | 'table';
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isTable = variant === 'table';

  if (!events.length) {
    return isTable ? (
      <Card>
        <Text variant="caption" center color={t.colors.ink3}>
          {tr('requestDetail.noHistory')}
        </Text>
      </Card>
    ) : null;
  }

  const hidden = isTable ? 0 : Math.max(0, events.length - COLLAPSED);
  const visible = isTable || expanded ? events : events.slice(-COLLAPSED);

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

      <Card style={isTable ? { gap: 0 } : { gap: 14 }}>
        {isTable && (
          <Row gap={12} style={{ paddingBottom: 9 }}>
            <View style={{ width: 30 }} />
            <Text variant="caption" weight="800" color={t.colors.ink3} style={{ flex: 1, fontSize: 11 }}>
              {tr('eventFeed.colEvent')}
            </Text>
            <Text variant="caption" weight="800" color={t.colors.ink3} style={{ fontSize: 11 }}>
              {tr('eventFeed.colWhen')}
            </Text>
          </Row>
        )}
        {visible.map((e, i) => {
          const caption = captionOf(e);
          return (
            <Row
              key={e.id}
              style={{
                alignItems: 'flex-start',
                ...(isTable
                  ? { paddingVertical: 10, borderTopWidth: 1, borderColor: t.colors.line }
                  : {}),
              }}
              gap={12}
            >
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
