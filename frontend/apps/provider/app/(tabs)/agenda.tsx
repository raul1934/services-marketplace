import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Badge, Card, EmptyState, Icon, Row, Screen, ServiceRequest, Text, flattenPages, isActiveStatus, useTheme } from '@walvee/shared';
import { useActiveJobs } from '../../src/queries';
import { CategoryIcon } from '../../src/components/CategoryIcon';

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const jobDate = (j: ServiceRequest) => new Date(j.availabilities?.[0]?.starts_at ?? j.accepted_at ?? j.created_at ?? Date.now());

export default function Agenda() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr, i18n } = useTranslation();
  const locale = i18n.language;
  const jobs = useActiveJobs();
  const isLoading = jobs.isLoading;

  const scheduled = flattenPages(jobs.data?.pages).filter((j) => isActiveStatus(j.status));
  const today = new Date();
  const todayKey = dayKey(today);

  // 7-day strip from today, with a per-day job count.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const count = scheduled.filter((j) => dayKey(jobDate(j)) === dayKey(d)).length;
    return { d, count };
  });

  // group jobs by day, ordered
  const groupsMap = new Map<string, { date: Date; items: ServiceRequest[] }>();
  for (const j of scheduled) {
    const d = jobDate(j);
    const k = dayKey(d);
    if (!groupsMap.has(k)) groupsMap.set(k, { date: d, items: [] });
    groupsMap.get(k)!.items.push(j);
  }
  const groups = Array.from(groupsMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  const relLabel = (d: Date) => {
    const k = dayKey(d);
    if (k === todayKey) return tr('agenda.today');
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (k === dayKey(tomorrow)) return tr('agenda.tomorrow');
    return d.toLocaleDateString(locale, { weekday: 'long' });
  };

  return (
    <Screen
      stickyHeader
      padded={false}
      onEndReached={() => { if (jobs.hasNextPage && !jobs.isFetchingNextPage) jobs.fetchNextPage(); }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text variant="h1">{tr('agenda.title')}</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 24, gap: 14, paddingTop: 14 }}>
        {/* week strip */}
        <Row gap={6}>
          {week.map(({ d, count }) => {
            const sel = dayKey(d) === todayKey;
            return (
              <View
                key={dayKey(d)}
                style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 9, borderRadius: 14, borderWidth: sel ? 0 : 1, borderColor: t.colors.line, backgroundColor: sel ? t.colors.accent : t.colors.surface, opacity: count === 0 && !sel ? 0.5 : 1 }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.4, color: sel ? 'rgba(255,255,255,0.85)' : t.colors.ink3 }}>
                  {d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 3).toUpperCase()}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: sel ? '#fff' : t.colors.ink }}>{d.getDate()}</Text>
                <View style={{ minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: count > 0 ? (sel ? 'rgba(255,255,255,0.28)' : t.colors.accent) : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {count > 0 && <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{count}</Text>}
                </View>
              </View>
            );
          })}
        </Row>

        {isLoading ? (
          <ActivityIndicator color={t.colors.accent} style={{ marginTop: 30 }} />
        ) : !groups.length ? (
          <EmptyState fill icon="calendar" title={tr('agenda.emptyTitle')} body={tr('agenda.emptyBody')} />
        ) : (
          groups.map((g) => (
            <View key={dayKey(g.date)} style={{ gap: 10 }}>
              <Row gap={8}>
                <Text weight="800" style={{ fontSize: 16, textTransform: 'capitalize' }}>{relLabel(g.date)}</Text>
                <Text variant="caption" weight="700">{g.date.toLocaleDateString(locale, { day: '2-digit', month: 'short' })}</Text>
                <View style={{ flex: 1 }} />
                <Badge label={tr('agenda.openCount', { count: g.items.length })} tone="open" />
              </Row>
              {g.items.map((j) => (
                <Card key={j.id} padded={false} style={{ padding: 14 }} onPress={() => router.push(`/job/${j.id}`)}>
                  <Row>
                    <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <CategoryIcon category={j.category} size={22} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text weight="800" style={{ fontSize: 14.5 }} numberOfLines={1}>{j.category && tr(`categories.${j.category.slug}`, { defaultValue: j.category.name })}</Text>
                      <Text variant="caption" numberOfLines={1}>{[j.client?.name, j.address].filter(Boolean).join(' · ')}</Text>
                    </View>
                  </Row>
                  {j.availabilities?.[0] && (
                    <Row gap={7} style={{ marginTop: 11 }}>
                      <Icon name="clock" size={15} color={t.colors.ink3} />
                      <Text variant="caption" weight="700">
                        {fmtTime(j.availabilities[0].starts_at, locale)} – {fmtTime(j.availabilities[0].ends_at, locale)}
                      </Text>
                    </Row>
                  )}
                </Card>
              ))}
            </View>
          ))
        )}

        {jobs.isFetchingNextPage && <ActivityIndicator color={t.colors.accent} style={{ marginVertical: 8 }} />}
      </View>
    </Screen>
  );
}

function fmtTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
