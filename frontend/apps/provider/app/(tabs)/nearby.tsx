import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  CATEGORY_TYPE_ORDER,
  CategoryType,
  Chip,
  EmptyState,
  Icon,
  IconButton,
  RequestUrgency,
  Row,
  Screen,
  SectionLabel,
  ServiceRequest,
  Text,
  brl,
  distanceLabel,
  flattenPages,
  relativeParts,
  useTheme,
} from '@walvee/shared';
import { useNearby, useScheduled } from '../../src/queries';
import { CategoryIcon, categoryIconName } from '../../src/components/CategoryIcon';
import { RequestMarker } from '../../src/components/RequestMarker';

type Filter = CategoryType | 'all';
type DateFilter = 'any' | 'today' | 'tomorrow' | 'week';
type Draft = { category: Filter; radiusKm: number; date: DateFilter };

const DISTANCE_OPTIONS = [5, 10, 20, 30, 50];
const DEFAULT_RADIUS = 30;
const MAX_RADIUS = 50; // fetch at the widest radius; distance is refined client-side
const DATE_OPTIONS: DateFilter[] = ['any', 'today', 'tomorrow', 'week'];

const matchCat = (r: ServiceRequest, c: Filter) => c === 'all' || r.category?.type === c;
const matchDist = (r: ServiceRequest, km: number) => r.distance_km == null || r.distance_km <= km;

/** Whether a request falls within the map's current viewport (+10% padding). */
const inView = (r: ServiceRequest, reg: Region) => {
  const dLat = (reg.latitudeDelta / 2) * 1.1;
  const dLng = (reg.longitudeDelta / 2) * 1.1;
  return Math.abs(r.latitude - reg.latitude) <= dLat && Math.abs(r.longitude - reg.longitude) <= dLng;
};

export default function Nearby() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [view, setView] = useState<'list' | 'map' | 'agenda'>('list');
  const [filter, setFilter] = useState<Filter>('all');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS);
  const [dateFilter, setDateFilter] = useState<DateFilter>('any');
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({ category: 'all', radiusKm: DEFAULT_RADIUS, date: 'any' });
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  // Map control: track the current center so a tapped marker can be panned into
  // the middle (without changing zoom) and the previous center restored on close.
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region | null>(null);
  const prevCenterRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const selectAndCenter = (r: ServiceRequest) => {
    prevCenterRef.current = regionRef.current
      ? { latitude: regionRef.current.latitude, longitude: regionRef.current.longitude }
      : null;
    setSelected(r);
    // Pan only (keep the current zoom) so repeated taps don't drift the zoom.
    mapRef.current?.animateCamera({ center: { latitude: r.latitude, longitude: r.longitude } }, { duration: 350 });
  };

  const closeSelected = () => {
    setSelected(null);
    if (prevCenterRef.current) mapRef.current?.animateCamera({ center: prevCenterRef.current }, { duration: 350 });
  };

  // Two dedicated endpoints: the urgent "now" feed (list/map) and the scheduled
  // feed (agenda tab). Fetched at the widest radius; distance/category/date are
  // refined client-side so the sheet can show a live match count.
  const now = useNearby(MAX_RADIUS);
  // Scheduled feed also powers the map; fetch a wider page there so distant
  // scheduled jobs (ordered by distance) aren't stuck on page 2.
  const sched = useScheduled(MAX_RADIUS, view === 'agenda' || view === 'map', view === 'map' ? 50 : undefined);
  const nowItems = useMemo(() => flattenPages(now.data?.pages), [now.data]);
  const schedItems = useMemo(() => flattenPages(sched.data?.pages), [sched.data]);

  const feed = useMemo(
    () => nowItems.filter((r) => matchCat(r, filter) && matchDist(r, radiusKm)),
    [nowItems, filter, radiusKm],
  );
  const scheduled = useMemo(
    () => schedItems.filter((r) => matchCat(r, filter) && matchDist(r, radiusKm) && matchesDate(r, dateFilter)),
    [schedItems, filter, radiusKm, dateFilter],
  );
  // The map shows everything loaded (urgent + scheduled, category-filtered) that
  // falls in the current viewport — the zoom governs what's visible, not the
  // distance chip (which still applies to the list/agenda).
  const mapItems = useMemo(
    () => [...nowItems.filter((r) => matchCat(r, filter)), ...schedItems.filter((r) => matchCat(r, filter))],
    [nowItems, schedItems, filter],
  );
  const visibleOnMap = useMemo(
    () => (mapRegion ? mapItems.filter((r) => inView(r, mapRegion)) : mapItems),
    [mapItems, mapRegion],
  );
  const center = feed[0] ?? scheduled[0] ?? nowItems[0] ?? schedItems[0];

  // Frame the map to fit all loaded requests on open; zooming in then narrows
  // what's shown (the viewport filter above).
  const mapInitialRegion = useMemo(() => {
    if (!mapItems.length) {
      return center ? { latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 } : undefined;
    }
    const lats = mapItems.map((r) => r.latitude);
    const lngs = mapItems.map((r) => r.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max((maxLat - minLat) * 1.3, 0.05),
      longitudeDelta: Math.max((maxLng - minLng) * 1.3, 0.05),
    };
  }, [mapItems, center]);

  // Live count for the sheet's "Apply" button, against the current tab's data.
  const draftCount = useMemo(() => {
    const src = view === 'agenda' ? schedItems : nowItems;
    return src.filter(
      (r) => matchCat(r, draft.category) && matchDist(r, draft.radiusKm) && (view === 'agenda' ? matchesDate(r, draft.date) : true),
    ).length;
  }, [view, nowItems, schedItems, draft]);

  const filtersActive = filter !== 'all' || radiusKm !== DEFAULT_RADIUS || dateFilter !== 'any';

  const openSheet = () => {
    setDraft({ category: filter, radiusKm, date: dateFilter });
    setSheetOpen(true);
  };
  const applyDraft = () => {
    setFilter(draft.category);
    setRadiusKm(draft.radiusKm);
    setDateFilter(draft.date);
    setSheetOpen(false);
  };

  // Scheduled jobs grouped by their first available date (YYYY-MM-DD), 'tbd' last.
  const agendaGroups = useMemo(() => {
    const m = new Map<string, ServiceRequest[]>();
    for (const r of scheduled) {
      const key = r.availabilities?.[0]?.starts_at?.slice(0, 10) ?? 'tbd';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    return [...m.entries()].sort(([a], [b]) => (a === 'tbd' ? 1 : b === 'tbd' ? -1 : a.localeCompare(b)));
  }, [scheduled]);

  return (
    <Screen stickyHeader padded={false} scroll={false}>
      <View style={{ paddingTop: 16, paddingBottom: 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text variant="h1" style={{ flex: 1 }}>{tr('nearby.title')}</Text>
        <FilterButton active={filtersActive} onPress={openSheet} />
      </View>

      {view === 'list' && (
        <FlatList
          style={{ flex: 1 }}
          data={feed}
          keyExtractor={(r) => String(r.id)}
          renderItem={({ item }) => <NearbyJob request={item} onBid={() => router.push(`/job/${item.id}`)} />}
          ItemSeparatorComponent={() => <View style={{ height: 13 }} />}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (now.hasNextPage && !now.isFetchingNextPage) now.fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            now.isLoading ? (
              <ActivityIndicator color={t.colors.accent} style={{ marginTop: 30 }} />
            ) : (
              <EmptyState fill title={tr('nearby.emptyTitle')} body={tr('nearby.emptyBody')} />
            )
          }
          ListFooterComponent={now.isFetchingNextPage ? <ActivityIndicator color={t.colors.accent} style={{ marginVertical: 16 }} /> : null}
        />
      )}

      {view === 'agenda' && (
        <FlatList
          style={{ flex: 1 }}
          data={agendaGroups}
          keyExtractor={([key]) => key}
          renderItem={({ item: [key, jobs] }) => (
            <View style={{ gap: 11 }}>
              <SectionLabel count={jobs.length}>{key === 'tbd' ? tr('nearby.noDate') : formatDateHeader(key)}</SectionLabel>
              {jobs.map((r) => (
                <NearbyJob key={r.id} request={r} scheduledWindow={windowLabel(r)} onBid={() => router.push(`/job/${r.id}`)} />
              ))}
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => { if (sched.hasNextPage && !sched.isFetchingNextPage) sched.fetchNextPage(); }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            sched.isLoading ? (
              <ActivityIndicator color={t.colors.accent} style={{ marginTop: 30 }} />
            ) : (
              <EmptyState fill icon="calendar" title={tr('nearby.agendaEmptyTitle')} body={tr('nearby.agendaEmptyBody')} />
            )
          }
          ListFooterComponent={sched.isFetchingNextPage ? <ActivityIndicator color={t.colors.accent} style={{ marginVertical: 16 }} /> : null}
        />
      )}

      {view === 'map' && (
        <View style={{ flex: 1 }}>
          {center ? (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={mapInitialRegion}
              onRegionChangeComplete={(reg) => { regionRef.current = reg; setMapRegion(reg); }}
            >
              {visibleOnMap.map((r) => {
                const urgent = r.urgency === RequestUrgency.Urgent;
                const color = urgent ? t.colors.danger : t.colors.accent;
                const price = r.area_avg_price ?? r.budget_max;
                // Scheduled pins show the date; urgent pins show the price hint.
                const label = urgent ? (price != null ? brl(price) : '') : shortDate(r);
                return (
                  <Marker key={r.id} coordinate={{ latitude: r.latitude, longitude: r.longitude }} onPress={() => selectAndCenter(r)}>
                    <RequestMarker color={color} label={label} iconName={categoryIconName(r.category)} />
                  </Marker>
                );
              })}
            </MapView>
          ) : (
            <Text variant="caption" center style={{ marginTop: 40 }}>{tr('nearby.mapEmpty')}</Text>
          )}

          {/* tapped-pin detail sheet */}
          {selected && (
            <View style={{ position: 'absolute', left: 12, right: 12, bottom: 82, zIndex: 1000, backgroundColor: t.colors.surface, borderRadius: 22, padding: 16, gap: 12, ...t.shadow }}>
              <View style={{ alignSelf: 'center', width: 38, height: 5, borderRadius: 3, backgroundColor: t.colors.line }} />
              <Row>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryIcon category={selected.category} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="800" style={{ fontSize: 15 }} numberOfLines={1}>{selected.category && tr(`categories.${selected.category.slug}`, { defaultValue: selected.category.name })}</Text>
                  <Text variant="caption" numberOfLines={1}>{[selected.address, distanceLabel(selected.distance_km)].filter(Boolean).join(' · ')}</Text>
                </View>
                {selected.urgency === RequestUrgency.Urgent ? (
                  <Badge label={tr('enums.urgency.urgent')} tone="urgent" dot />
                ) : shortDate(selected) ? (
                  <Badge label={[shortDate(selected), windowLabel(selected)].filter(Boolean).join(' · ')} tone="open" />
                ) : null}
                <Pressable onPress={closeSelected} hitSlop={8}><Icon name="close" size={18} color={t.colors.ink3} /></Pressable>
              </Row>
              <Row>
                {selected.area_avg_price != null && (
                  <Text variant="caption" weight="700">{tr('dashboard.areaAvg', { value: brl(selected.area_avg_price) })}</Text>
                )}
                <View style={{ flex: 1 }} />
                <Button title={tr('nearby.sendBid')} variant="grad" size="sm" onPress={() => router.push(`/job/${selected.id}`)} />
              </Row>
            </View>
          )}
        </View>
      )}

      {/* floating view toggle */}
      <View style={{ position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', gap: 4, padding: 5, borderRadius: 999, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, ...t.shadow }}>
        <VT icon="list" label={tr('nearby.list')} on={view === 'list'} onPress={() => setView('list')} />
        <VT icon="location" label={tr('nearby.map')} on={view === 'map'} onPress={() => setView('map')} />
        <VT icon="calendar" label={tr('nearby.calendar')} on={view === 'agenda'} onPress={() => setView('agenda')} />
      </View>

      <FilterSheet
        visible={sheetOpen}
        showDate={view === 'agenda'}
        draft={draft}
        setDraft={setDraft}
        count={draftCount}
        onApply={applyDraft}
        onClear={() => setDraft({ category: 'all', radiusKm: DEFAULT_RADIUS, date: 'any' })}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  );
}

/** Bottom sheet: filter by distance, category and (agenda only) date. The apply
 *  button shows the live count of jobs matching the draft filter. */
function FilterSheet({
  visible, showDate, draft, setDraft, count, onApply, onClear, onClose,
}: {
  visible: boolean;
  showDate: boolean;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  count: number;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <View style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, gap: 18 }}>
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.colors.line }} />
        <Row>
          <Text variant="h3" style={{ flex: 1 }}>{tr('nearby.filtersTitle')}</Text>
          <Text weight="700" color={t.colors.ink3} style={{ fontSize: 13 }} onPress={onClear}>{tr('nearby.clear')}</Text>
        </Row>

        <View style={{ gap: 10 }}>
          <SectionLabel>{tr('nearby.distanceLabel')}</SectionLabel>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {DISTANCE_OPTIONS.map((km) => (
              <Chip key={km} label={tr('nearby.kmShort', { km })} active={draft.radiusKm === km} onPress={() => setDraft((d) => ({ ...d, radiusKm: km }))} />
            ))}
          </Row>
        </View>

        <View style={{ gap: 10 }}>
          <SectionLabel>{tr('nearby.categoryLabel')}</SectionLabel>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            <Chip label={tr('nearby.filterAll')} active={draft.category === 'all'} onPress={() => setDraft((d) => ({ ...d, category: 'all' }))} />
            {CATEGORY_TYPE_ORDER.map((type) => (
              <Chip key={type} label={tr(`enums.categoryType.${type}`)} active={draft.category === type} onPress={() => setDraft((d) => ({ ...d, category: type }))} />
            ))}
          </Row>
        </View>

        {showDate && (
          <View style={{ gap: 10 }}>
            <SectionLabel>{tr('nearby.dateLabel')}</SectionLabel>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {DATE_OPTIONS.map((d) => (
                <Chip key={d} label={tr(`nearby.dates.${d}`)} active={draft.date === d} onPress={() => setDraft((x) => ({ ...x, date: d }))} />
              ))}
            </Row>
          </View>
        )}

        <Button title={tr('nearby.apply', { count })} full onPress={onApply} />
      </View>
    </Modal>
  );
}

/** Whether a scheduled request's first availability falls in the date window. */
function matchesDate(r: ServiceRequest, date: DateFilter): boolean {
  if (date === 'any') return true;
  const iso = r.availabilities?.[0]?.starts_at;
  if (!iso) return false;
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (date === 'today') return diffDays === 0;
  if (date === 'tomorrow') return diffDays === 1;
  return diffDays >= 0 && diffDays < 7; // week
}

/** Top-bar filter button — opens the category filter; shows a dot when active. */
function FilterButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <View>
      <IconButton name="filter" size={18} onPress={onPress} />
      {active && (
        <View
          style={{
            position: 'absolute',
            top: -1,
            right: -1,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: t.colors.accent,
            borderWidth: 2,
            borderColor: t.colors.bg,
          }}
        />
      )}
    </View>
  );
}

function VT({ icon, label, on, onPress }: { icon: string; label: string; on: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: on ? t.colors.accent : 'transparent' }}>
      <Icon name={icon} size={16} color={on ? t.colors.accentInk : t.colors.ink2} />
      <Text weight="700" style={{ fontSize: 13 }} color={on ? t.colors.accentInk : t.colors.ink2}>{label}</Text>
    </Pressable>
  );
}

function NearbyJob({ request, onBid, scheduledWindow }: { request: ServiceRequest; onBid: () => void; scheduledWindow?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const created = request.created_at ? relativeParts(request.created_at) : null;
  const createdLabel = created
    ? created.unit === 'now'
      ? tr('time.now')
      : tr(`time.${created.unit}Ago`, { count: created.count })
    : null;
  return (
    <Card padded={false} style={{ padding: 15 }} onPress={onBid}>
      <Row style={{ alignItems: 'flex-start' }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <CategoryIcon category={request.category} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="800" style={{ fontSize: 15 }} numberOfLines={1}>{request.category && tr(`categories.${request.category.slug}`, { defaultValue: request.category.name })}</Text>
          <Text variant="caption" numberOfLines={1} style={{ marginTop: 2 }}>{request.address ?? request.description}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          {request.urgency === RequestUrgency.Urgent && <Badge label={tr('enums.urgency.urgent')} tone="urgent" dot />}
          {createdLabel && (
            <Row gap={4}>
              <Icon name="clock" size={11} color={t.colors.ink3} />
              <Text variant="caption" weight="700" color={t.colors.ink3}>{createdLabel}</Text>
            </Row>
          )}
        </View>
      </Row>
      <Row style={{ marginTop: 12, gap: 8 }}>
        {scheduledWindow && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.colors.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
            <Icon name="calendar" size={12} color={t.colors.accent} />
            <Text weight="800" style={{ fontSize: 12 }} color={t.colors.accent}>{scheduledWindow}</Text>
          </View>
        )}
        {request.distance_km != null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: t.colors.accentSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
            <Icon name="pin" size={12} color={t.colors.accent} fill="current" />
            <Text weight="800" style={{ fontSize: 12 }} color={t.colors.accent}>{distanceLabel(request.distance_km)}</Text>
          </View>
        )}
        {request.budget_max != null && (
          <Text variant="caption" weight="700">{tr('jobCard.upTo', { value: brl(request.budget_max) })}</Text>
        )}
        <View style={{ flex: 1 }} />
        {request.my_proposal ? (
          <Badge label={tr('nearby.bidSent')} tone="ok" dot />
        ) : (
          <Button title={tr('nearby.sendBid')} variant="grad" size="sm" onPress={onBid} />
        )}
      </Row>
    </Card>
  );
}

/** "Seg, 23 jun" header for a scheduled-jobs date group. */
function formatDateHeader(key: string): string {
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
}

/** Soonest availability as a short "29 jun" label for a scheduled map pin. */
function shortDate(r: ServiceRequest): string {
  const starts = (r.availabilities ?? []).map((a) => a.starts_at).filter(Boolean).sort();
  if (!starts.length) return '';
  return new Date(starts[0] as string).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** "08:00–12:00" window from the request's first availability, if any. */
function windowLabel(req: ServiceRequest): string | undefined {
  const w = req.availabilities?.[0];
  if (!w?.starts_at) return undefined;
  const fmt = (s?: string | null) => (s ? new Date(s).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
  const start = fmt(w.starts_at);
  const end = fmt(w.ends_at);
  return end ? `${start}–${end}` : start;
}
