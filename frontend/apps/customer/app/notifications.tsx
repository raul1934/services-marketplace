import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Card, EmptyState, Icon, PaginatedList, Row, Text, focusRing, relativeParts, useTheme } from '@chamafacil/shared';
import { AppNotification } from '../src/api';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadCount } from '../src/queries';
import { notificationIcon, notificationRoute } from '../src/notificationLinks';

/** Avisos: the bell's list — everything the server told this user. */
export default function NotificationsScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const query = useNotifications();
  const unread = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const open = (n: AppNotification) => {
    // Read it either way — tapping is acknowledgement, even when this app
    // version has nowhere to send you.
    if (!n.read_at) markRead.mutate(n.id);
    const route = notificationRoute(n);
    if (route) router.push(route as never);
  };

  return (
    <PaginatedList<AppNotification>
      query={query}
      padded={false}
      keyExtractor={(n) => n.id}
      header={
        <BackBar backLabel={tr('common.back')}
          title={tr('notifications.title')}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          right={
            unread.data?.count ? (
              <Pressable
                onPress={() => markAll.mutate()}
                accessibilityRole="button"
                accessibilityLabel={tr('notifications.markAll')}
                // The label is ~18px tall, so hitSlop is doing all the work of
                // reaching a 44dp target; 8 left it around 34.
                hitSlop={14}
                disabled={markAll.isPending}
                style={({ focused }: any) => focusRing(t.colors.accent, focused)}
              >
                <Text weight="700" color={t.colors.accent} style={{ fontSize: 13 }}>
                  {tr('notifications.markAll')}
                </Text>
              </Pressable>
            ) : undefined
          }
        />
      }
      contentContainerStyle={{ paddingHorizontal: 20 }}
      empty={<EmptyState fill icon="bell" title={tr('notifications.emptyTitle')} body={tr('notifications.emptyBody')} />}
      renderItem={(n) => <NotificationRow notification={n} onPress={() => open(n)} />}
    />
  );
}

function NotificationRow({ notification: n, onPress }: { notification: AppNotification; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const rel = n.created_at ? relativeParts(n.created_at) : null;
  const ago = !rel ? '' : rel.unit === 'now' ? tr('time.now') : tr(`time.${rel.unit}Ago`, { count: rel.count });
  const isUnread = !n.read_at;

  return (
    <Card onPress={onPress}>
      <Row gap={12}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: isUnread ? t.colors.accentSoft : t.colors.surface2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={notificationIcon(n)} size={20} color={isUnread ? t.colors.accent : t.colors.ink3} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight={isUnread ? '800' : '600'} style={{ fontSize: 14.5 }} numberOfLines={2}>
            {n.title ?? tr('notifications.untitled')}
          </Text>
          {n.body ? (
            <Text variant="caption" numberOfLines={2}>
              {n.body}
            </Text>
          ) : null}
          {ago ? (
            <Text variant="caption" color={t.colors.ink3} style={{ marginTop: 2 }}>
              {ago}
            </Text>
          ) : null}
        </View>
        {/* The dot is the only thing marking a notification unread, and a dot is
            not information a screen reader can convey — it needs the word. The
            label rides on the dot rather than the row so the row's own text is
            not rewritten. */}
        {isUnread ? (
          <View
            accessible
            accessibilityLabel={tr('notifications.unread')}
            style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.colors.accent }}
          />
        ) : null}
      </Row>
    </Card>
  );
}
