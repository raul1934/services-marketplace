import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Alert } from '@walvee/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  AppDrawer,
  AvInit,
  EmptyState,
  Badge,
  Button,
  Card,
  IconButton,
  Row,
  Screen,
  SectionLabel,
  ServiceRequest,
  Text,
  Toggle,
  brl,
  distanceLabel,
  flattenPages,
  isActiveStatus,
  useAuth,
  useTheme,
} from '@walvee/shared';
import { useActiveJobs, useDashboard, useNearby, useSetOnline } from '../../src/queries';
import { getCurrentCoords } from '../../src/location';
import { CategoryIcon } from '../../src/components/CategoryIcon';

const initialsOf = (name?: string | null) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function Dashboard() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { user, refresh, logout } = useAuth();
  const profile = user?.provider_profile;

  const [online, setOnline] = useState(!!profile?.is_online);
  const [drawer, setDrawer] = useState(false);
  const setOnlineMut = useSetOnline();
  const jobs = useActiveJobs();
  const nearby = useNearby(30, online);
  const stats = useDashboard();

  const inProgress = flattenPages(jobs.data?.pages).filter((j) => isActiveStatus(j.status));
  const topNearby = flattenPages(nearby.data?.pages).slice(0, 1);

  const toggle = async () => {
    const value = !online;
    setOnline(value);
    try {
      const loc = value ? await getCurrentCoords() : undefined;
      await setOnlineMut.mutateAsync({ online: value, loc });
      await refresh();
    } catch (e) {
      setOnline(!value);
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  return (
    <Screen stickyHeader padded={false}>
      <AppBar
        sub={tr('dashboard.providerMode')}
        title={user?.name?.split(' ')[0] ?? tr('dashboard.fallbackName')}
        left={<IconButton name="menu" accessibilityLabel={tr('common.menu')} onPress={() => setDrawer(true)} />}
        right={
          <Row gap={10}>
            <IconButton name="bell" accessibilityLabel={tr('common.notifications')} />
            <Pressable onPress={() => router.push('/(tabs)/profile')} accessibilityLabel={tr('drawer.myAccount')}>
              <AvInit initials={initialsOf(user?.name)} color="#3b82f6" size={42} />
            </Pressable>
          </Row>
        }
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
        {/* online card */}
        <Pressable onPress={toggle}>
          {online ? (
            <LinearGradient colors={t.grad as unknown as readonly [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: t.radius.card, padding: 20, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.14)' }} />
              <Row>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 }}>{tr('dashboard.youreOnline')}</Text>
                  <Text weight="800" color="#fff" style={{ fontSize: 20, marginTop: 2 }}>{tr('dashboard.onlineCaption')}</Text>
                </View>
                {setOnlineMut.isPending ? <ActivityIndicator color="#fff" /> : <Toggle on />}
              </Row>
            </LinearGradient>
          ) : (
            <View style={{ borderRadius: t.radius.card, padding: 20, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line }}>
              <Row>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12.5, fontWeight: '700', color: t.colors.ink3, letterSpacing: 0.5 }}>{tr('dashboard.youreOffline')}</Text>
                  <Text weight="800" style={{ fontSize: 20, marginTop: 2 }}>{tr('dashboard.offlineCaption')}</Text>
                </View>
                {setOnlineMut.isPending ? <ActivityIndicator color={t.colors.accent} /> : <Toggle on={false} />}
              </Row>
            </View>
          )}
        </Pressable>

        {/* stats — today's earnings, today's jobs, rating */}
        <Card>
          <Row style={{ alignItems: 'stretch' }}>
            <Stat v={brl(stats.data?.earnings_today ?? 0)} k={tr('dashboard.statToday')} />
            <View style={{ width: 1, backgroundColor: t.colors.line }} />
            <Stat v={String(stats.data?.jobs_today ?? 0)} k={tr('dashboard.statJobs')} pad />
            <View style={{ width: 1, backgroundColor: t.colors.line }} />
            <Stat v={`${(stats.data?.rating_avg ?? profile?.rating_avg ?? 0).toFixed(1)} ★`} k={tr('dashboard.statRating')} pad />
          </Row>
        </Card>

        {inProgress.length > 0 && (
          <>
            <SectionLabel>{tr('dashboard.inProgress')}</SectionLabel>
            {inProgress.map((j) => (
              <Card key={j.id} onPress={() => router.push(`/job/${j.id}`)}>
                <Row>
                  <CatTile category={j.category} />
                  <View style={{ flex: 1 }}>
                    <Text weight="800" style={{ fontSize: 15.5 }} numberOfLines={1}>{j.category && tr(`categories.${j.category.slug}`, { defaultValue: j.category.name })}</Text>
                    <Text variant="caption" numberOfLines={1}>{[j.client?.name, distanceLabel(j.distance_km)].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <Badge label={tr('enums.requestStatus.in_progress')} tone="live" dot />
                </Row>
              </Card>
            ))}
          </>
        )}

        <SectionLabel>{tr('dashboard.newNearby')}</SectionLabel>
        {!online ? (
          <EmptyState tone="muted" icon="power" title={tr('dashboard.youreOffline')} body={tr('dashboard.offlineHint')} />
        ) : nearby.isLoading ? (
          <ActivityIndicator color={t.colors.accent} />
        ) : topNearby.length ? (
          topNearby.map((r) => (
            <Card key={r.id} style={{ borderWidth: 1.5, borderColor: t.colors.accent }} onPress={() => router.push(`/job/${r.id}`)}>
              <Row>
                <CatTile category={r.category} grad />
                <View style={{ flex: 1 }}>
                  <Text weight="800" style={{ fontSize: 15.5 }} numberOfLines={1}>{r.category && tr(`categories.${r.category.slug}`, { defaultValue: r.category.name })}</Text>
                  <Text variant="caption" numberOfLines={1}>
                    {[
                      distanceLabel(r.distance_km),
                      r.area_avg_price != null ? tr('dashboard.areaAvg', { value: brl(r.area_avg_price) }) : (r.budget_max != null ? tr('jobCard.upTo', { value: brl(r.budget_max) }) : null),
                    ].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Button title={tr('dashboard.bid')} variant="grad" size="sm" onPress={() => router.push(`/job/${r.id}`)} />
              </Row>
            </Card>
          ))
        ) : (
          <Text variant="caption">{tr('dashboard.noUrgent')}</Text>
        )}
      </View>

      <AppDrawer
        visible={drawer}
        onClose={() => setDrawer(false)}
        name={user?.name}
        subtitle={profile ? `${(profile.rating_avg ?? 0).toFixed(1)} ★ · ${profile.jobs_completed ?? 0} ${tr('drawer.jobsDone')}` : undefined}
        avatarUri={user?.avatar_url}
        sections={[
          {
            title: tr('drawer.account'),
            items: [
              { icon: 'user', label: tr('drawer.myAccount'), onPress: () => router.push('/(tabs)/profile') },
              { icon: 'wrench', label: tr('drawer.myServices'), onPress: () => router.push('/config') },
              { icon: 'dollar', label: tr('drawer.earnings'), onPress: () => router.push('/earnings') },
            ],
          },
          {
            title: tr('drawer.activity'),
            items: [
              { icon: 'briefcase', label: tr('drawer.jobs'), onPress: () => router.push('/(tabs)/jobs') },
              { icon: 'calendar', label: tr('drawer.agenda'), onPress: () => router.push('/(tabs)/agenda') },
              { icon: 'search', label: tr('drawer.nearby'), onPress: () => router.push('/nearby') },
            ],
          },
        ]}
        footer={{ icon: 'power', label: tr('drawer.logout'), danger: true, onPress: logout }}
      />
    </Screen>
  );
}

function Stat({ v, k, pad }: { v: string; k: string; pad?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, paddingLeft: pad ? 16 : 0 }}>
      <Text style={{ fontSize: 22, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.4 }}>{v}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.colors.ink3, letterSpacing: 0.5, marginTop: 2 }}>{k.toUpperCase()}</Text>
    </View>
  );
}

function CatTile({ category, grad }: { category?: ServiceRequest['category']; grad?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: grad ? t.colors.accent : t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
      <CategoryIcon category={category} size={24} color={grad ? '#fff' : t.colors.accent} />
    </View>
  );
}
