import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  AppDrawer,
  AvatarGrad,
  Badge,
  Card,
  CatTile,
  Icon,
  IconButton,
  RequestStatus,
  RequestUrgency,
  Row,
  Screen,
  SectionLabel,
  ServiceRequest,
  Steps,
  Text,
  flattenPages,
  isActiveStatus,
  relativeParts,
  useAuth,
  useTheme,
} from '@walvee/shared';
import { useCategories, useMyRequests } from '../../src/queries';
import { CategoryIcon } from '../../src/components/CategoryIcon';

function initialsOf(name?: string | null) {
  return (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

/** 3-step lifecycle position from status (Created → Bids → On the way). */
function stepOf(status: RequestStatus): number {
  if (status === RequestStatus.Open) return 2;
  if (isActiveStatus(status)) return 3;
  return 3;
}

/** How many request cards the home shows before the "see all" button. */
const MAX_HOME_CARDS = 2;

/**
 * Priority for the home active-requests list (lower = shown first):
 * open+urgent → open (em cotação) → requote → open+scheduled → accepted/in-progress.
 * Terminal requests (completed/cancelled/expired) return 99 and are excluded.
 */
function rankOf(r: ServiceRequest): number {
  const open = r.status === RequestStatus.Open;
  if (open && r.urgency === RequestUrgency.Urgent) return 0;
  if (open && r.urgency !== RequestUrgency.Scheduled) return 1;
  if (r.status === RequestStatus.Requote) return 2;
  if (open && r.urgency === RequestUrgency.Scheduled) return 3;
  if (isActiveStatus(r.status)) return 4;
  return 99;
}

/** Soonest future availability (ms), falling back to created_at — for date sorting. */
function nextDateMs(r: ServiceRequest): number {
  const times = (r.availabilities ?? [])
    .map((a) => new Date(a.starts_at).getTime())
    .filter((n) => !Number.isNaN(n));
  if (times.length) return Math.min(...times);
  return r.created_at ? new Date(r.created_at).getTime() : 0;
}

export default function Home() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { user, logout } = useAuth();
  const requests = useMyRequests();
  const categories = useCategories();
  const [drawer, setDrawer] = useState(false);

  // Home shows only the most relevant active requests (capped below), so the
  // first page is enough — it never paginates.
  const candidates = flattenPages(requests.data?.pages)
    .filter((r) => rankOf(r) < 99)
    .sort((a, b) => {
      const ra = rankOf(a);
      const rb = rankOf(b);
      if (ra !== rb) return ra - rb;
      // Scheduled tier: soonest date first; every other tier: most recent first.
      return ra === 3 ? nextDateMs(a) - nextDateMs(b) : nextDateMs(b) - nextDateMs(a);
    });
  const visibleRequests = candidates.slice(0, MAX_HOME_CARDS);
  const topCats = categories.data?.slice(0, 4) ?? [];
  const firstName = user?.name?.split(' ')[0];

  return (
    <Screen stickyHeader padded={false}>
      <AppBar
        sub={tr('home.greeting')}
        title={firstName ?? tr('home.fallbackName')}
        left={<IconButton name="menu" accessibilityLabel={tr('common.menu')} onPress={() => setDrawer(true)} />}
        right={
          <Row gap={10}>
            <IconButton name="bell" accessibilityLabel={tr('common.notifications')} />
            <AvatarGrad initials={initialsOf(user?.name)} />
          </Row>
        }
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
        {candidates.length > 0 ? (
          <>
            <SectionLabel>{tr('home.activeRequest')}</SectionLabel>
            {visibleRequests.map((r) => (
              <ActiveRequestCard key={r.id} request={r} onPress={() => router.push(`/request/${r.id}`)} />
            ))}
            {candidates.length > MAX_HOME_CARDS && (
              <Pressable
                onPress={() => router.push('/(tabs)/requests')}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 }}
              >
                <Text weight="700" color={t.colors.accent} style={{ fontSize: 13.5 }}>
                  {tr('home.seeAll', { count: candidates.length })}
                </Text>
                <Icon name="arrowR" size={15} color={t.colors.accent} />
              </Pressable>
            )}
          </>
        ) : null}

        <SectionLabel>{tr('home.quickHelp')}</SectionLabel>
        {categories.isLoading ? (
          <ActivityIndicator color={t.colors.accent} />
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {topCats.map((c) => (
              <View key={c.id} style={{ width: '23%' }}>
                <CatTile
                  label={tr(`categories.${c.slug}`, { defaultValue: c.name })}
                  onPress={() => router.push({ pathname: '/request/new', params: { categoryId: c.id } })}
                  icon={
                    <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <CategoryIcon category={c} size={28} />
                    </View>
                  }
                />
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={() => router.push('/categories')}>
          <LinearGradient
            colors={t.grad as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: t.radius.card, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <View style={{ flex: 1 }}>
              <Text weight="800" color="#fff" style={{ fontSize: 17 }}>{tr('home.needHelpTitle')}</Text>
              <Text color="rgba(255,255,255,0.9)" style={{ fontSize: 13, marginTop: 2 }}>{tr('home.needHelpBody')}</Text>
            </View>
            <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={26} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      <AppDrawer
        visible={drawer}
        onClose={() => setDrawer(false)}
        name={user?.name}
        subtitle={user?.email ?? user?.phone}
        avatarUri={user?.avatar_url}
        sections={[
          {
            title: tr('drawer.account'),
            items: [
              { icon: 'user', label: tr('drawer.myProfile'), onPress: () => router.push('/(tabs)/profile') },
              { icon: 'car', label: tr('drawer.myAssets'), onPress: () => router.push('/assets') },
            ],
          },
          {
            title: tr('drawer.activity'),
            items: [
              { icon: 'list', label: tr('drawer.myRequests'), onPress: () => router.push('/(tabs)/requests') },
              { icon: 'plus', label: tr('drawer.newRequest'), onPress: () => router.push('/categories') },
            ],
          },
        ]}
        footer={{ icon: 'power', label: tr('drawer.logout'), danger: true, onPress: logout }}
      />
    </Screen>
  );
}

function ActiveRequestCard({ request, onPress }: { request: ServiceRequest; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const rel = relativeParts(request.created_at);
  const ago = rel.unit === 'now' ? tr('time.now') : tr(`time.${rel.unit}Ago`, { count: rel.count });
  const isOpen = request.status === RequestStatus.Open;
  return (
    <Card padded={false} style={{ overflow: 'hidden' }} onPress={onPress}>
      <View style={{ padding: 18 }}>
        <Row>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <CategoryIcon category={request.category} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="800" style={{ fontSize: 16 }} numberOfLines={1}>{request.category && tr(`categories.${request.category.slug}`, { defaultValue: request.category.name })}</Text>
            <Text variant="caption" numberOfLines={1}>{[request.address, ago].filter(Boolean).join(' · ')}</Text>
          </View>
          {request.urgency === RequestUrgency.Urgent && <Badge label={tr('enums.urgency.urgent')} tone="urgent" dot />}
        </Row>
        <Row style={{ marginTop: 14 }}>
          <Steps total={3} current={stepOf(request.status)} />
          <View style={{ flex: 1 }} />
          {isOpen ? (
            <Badge label={tr('requestCard.proposals', { count: request.proposals_count ?? 0 })} tone="open" dot />
          ) : (
            <Badge label={tr(`enums.requestStatus.${request.status}`)} tone="live" dot />
          )}
        </Row>
      </View>
      <View style={{ backgroundColor: t.colors.surface2, paddingVertical: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="arrowR" size={17} color={t.colors.accent} />
        <Text weight="700" color={t.colors.accent} style={{ fontSize: 13.5 }}>{isOpen ? tr('home.reviewBids') : tr('home.trackRequest')}</Text>
      </View>
    </Card>
  );
}
