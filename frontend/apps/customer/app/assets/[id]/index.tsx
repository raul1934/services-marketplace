import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  SkeletonScreen,
  BackBar,
  Card,
  EmptyState,
  FieldDisplay,
  Icon,
  NotFoundView,
  Row,
  Screen,
  SectionLabel,
  Segment,
  ServiceRequest,
  Text,
  useTheme,
} from '@chamafacil/shared';
import { useAddReading, useAsset, useAssetHistory, useAssetParts, useAssetReadings } from '../../../src/queries';
import { AssetPart, AssetReading } from '../../../src/api';
import { ASSET_FIELDS, AssetTypeKey } from '../../../src/assetFields';
import { ICON } from '../../../src/assetDisplay';
import { RequestCard } from '../../../src/components/RequestCard';
import { RecordKmSheet } from '../../../src/components/RecordKmSheet';
import { AssetParts } from '../../../src/components/AssetParts';

type TabKey = 'identity' | 'history';

/** One timeline row, free from whichever model produced it. Every source maps
 *  into this shape and we render a single ordered list — not three stacked ones. */
type TimelineEvent =
  | { key: string; at: string | null; kind: 'request'; request: ServiceRequest }
  | { key: string; at: string | null; kind: 'reading'; reading: AssetReading }
  | { key: string; at: string | null; kind: 'measurement'; part: AssetPart };

const fmtKm = (n: number) => `${n.toLocaleString('pt-BR')} km`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

/** Newest first. ISO-8601 strings compare correctly lexicographically; a row with
 *  no timestamp at all can't be placed, so it sinks to the bottom. */
const byNewest = (a: TimelineEvent, b: TimelineEvent) => {
  if (!a.at && !b.at) return 0;
  if (!a.at) return 1;
  if (!b.at) return -1;
  return a.at < b.at ? 1 : a.at > b.at ? -1 : 0;
};

/** Asset detail (R6). Two tabs of different natures: the asset itself — which you
 *  edit and act on — and its history, which you only read. */
export default function AssetDetail() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assetId = Number(id);

  const { data: asset, isLoading } = useAsset(assetId);
  const isVehicle = asset?.type === 'vehicle';
  const isProperty = asset?.type === 'property';
  const readingsQ = useAssetReadings(assetId, !!isVehicle);
  const historyQ = useAssetHistory(assetId);
  const partsQ = useAssetParts(assetId, !!isProperty);
  const addReading = useAddReading(assetId);
  const [kmOpen, setKmOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('identity');

  const historyPages = historyQ.data?.pages;
  const readingPages = readingsQ.data?.pages;
  const partsData = partsQ.data;

  const history = useMemo(() => (historyPages ?? []).flatMap((p) => p.data), [historyPages]);
  const readings = useMemo(() => (readingPages ?? []).flatMap((p) => p.data), [readingPages]);

  /** The merge: three sources, one typed list, sorted as a whole. */
  const events = useMemo<TimelineEvent[]>(() => {
    const out: TimelineEvent[] = [];
    for (const r of history) out.push({ key: `req-${r.id}`, at: r.created_at ?? null, kind: 'request', request: r });
    for (const r of readings) out.push({ key: `read-${r.id}`, at: r.recorded_at, kind: 'reading', reading: r });
    // An unmeasured room is an empty slot, not an event — only a measurement happened.
    for (const p of partsData ?? []) {
      if (p.measured_at) out.push({ key: `part-${p.id}`, at: p.measured_at, kind: 'measurement', part: p });
    }
    return out.sort(byNewest);
  }, [history, readings, partsData]);

  if (isLoading) return <SkeletonScreen />;
  if (!asset) {
    return (
      <NotFoundView
        showBackBar
        icon="car"
        title={tr('notFound.asset.title')}
        body={tr('notFound.asset.body')}
        homeLabel={tr('notFound.home')}
        onHome={() => router.replace('/assets')}
        backLabel={tr('common.back')}
        onBack={router.canGoBack() ? () => router.back() : undefined}
      />
    );
  }

  const type = asset.type as AssetTypeKey;
  const detail = asset.detail ?? {};
  const makeLogo = isVehicle ? detail.make_logo_url ?? null : null;

  // Read-only characteristic rows (only those with a value).
  const rows: { label: string; value: string }[] = [];
  if (isVehicle) {
    if (detail.make) rows.push({ label: tr('assets.fields.make'), value: String(detail.make) });
    if (detail.model) rows.push({ label: tr('assets.fields.model'), value: String(detail.model) });
  }
  if (type === 'property' && detail.kind) rows.push({ label: tr('assets.fields.kind'), value: String(detail.kind) });
  if (type === 'pet') {
    if (detail.species) rows.push({ label: tr('assets.fields.species'), value: String(detail.species) });
    if (detail.breed) rows.push({ label: tr('assets.fields.breed'), value: String(detail.breed) });
  }
  for (const f of ASSET_FIELDS[type] ?? []) {
    const v = detail[f.key as keyof typeof detail];
    if (v) rows.push({ label: tr(`assets.fields.${f.key}`), value: String(v) });
  }

  const services = history.slice(0, 8).map((r) => ({
    id: r.id,
    label: r.category ? tr(`categories.${r.category.slug}`, { defaultValue: r.category.name }) : `#${r.id}`,
  }));

  const submitKm = (payload: { mileage: number; note?: string; service_request_id?: number }) =>
    addReading.mutate(payload, { onSuccess: () => setKmOpen(false) });

  // Two paginated sources feed one list, so "more" means either still has pages.
  // We keep pulling until both are exhausted, and until then the list is a prefix
  // of the real timeline — never dressed up as the whole of it (see the footer).
  const hasMore = historyQ.hasNextPage || (!!isVehicle && readingsQ.hasNextPage);
  const fetchingMore = historyQ.isFetchingNextPage || readingsQ.isFetchingNextPage;
  const loadMore = () => {
    if (historyQ.hasNextPage && !historyQ.isFetchingNextPage) historyQ.fetchNextPage();
    if (isVehicle && readingsQ.hasNextPage && !readingsQ.isFetchingNextPage) readingsQ.fetchNextPage();
  };

  // The first tab is the asset itself, so its label is the asset's own type
  // ("Veículo" / "Imóvel" / "Pet") — "Imóvel" would be a lie for a car.
  const tabs = [
    { value: 'identity' as const, label: tr(`assets.type.${type}`) },
    { value: 'history' as const, label: tr('assets.tabs.history') },
  ];

  return (
    <Screen stickyHeader padded={false} onEndReached={() => tab === 'history' && hasMore && loadMore()}>
      <BackBar
        backLabel={tr('common.back')}
        title={asset.nickname}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/assets'))}
        right={
          <Pressable onPress={() => router.push(`/assets/${assetId}/edit`)} hitSlop={8} accessibilityRole="button">
            <Text variant="label" color={t.colors.accent}>{tr('assets.edit')}</Text>
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16 }}>
        <Segment items={tabs} value={tab} onChange={setTab} />

        {tab === 'identity' ? (
          <>
            {/* Photo / brand logo / type icon */}
            <View style={{ alignItems: 'center', gap: 8 }}>
              {asset.photo_url ? (
                <Image source={{ uri: asset.photo_url }} style={{ width: '100%', height: 180, borderRadius: 18 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 110, height: 110, borderRadius: 22, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  {makeLogo ? (
                    <Image source={{ uri: makeLogo }} style={{ width: 76, height: 76 }} resizeMode="contain" />
                  ) : (
                    <Icon name={ICON[type] ?? 'car'} size={48} color={t.colors.accent} />
                  )}
                </View>
              )}
              <Row gap={6} style={{ justifyContent: 'center' }}>
                {makeLogo && asset.photo_url ? <Image source={{ uri: makeLogo }} style={{ width: 22, height: 22 }} resizeMode="contain" /> : null}
                <Text variant="caption">{tr(`assets.type.${type}`)}</Text>
              </Row>
            </View>

            {/* Characteristics */}
            {rows.length > 0 ? (
              <View style={{ gap: 10 }}>
                <SectionLabel>{tr('assets.detailsLabel')}</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {rows.map((r) => (
                    <View key={r.label} style={{ width: '48%', flexGrow: 1 }}>
                      <FieldDisplay label={r.label} value={r.value} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Location + footprint (properties) */}
            {type === 'property' && detail.latitude != null && detail.longitude != null ? (
              <View style={{ gap: 10 }}>
                <SectionLabel>{tr('assets.locationLabel')}</SectionLabel>
                <Card padded={false} style={{ overflow: 'hidden' }}>
                  <View pointerEvents="none">
                    <MapView
                      style={{ height: 180 }}
                      region={{ latitude: detail.latitude, longitude: detail.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                    >
                      <Marker coordinate={{ latitude: detail.latitude, longitude: detail.longitude }} pinColor={t.colors.accent} />
                      {detail.geofence && detail.geofence.length >= 2 ? (
                        <Polygon coordinates={detail.geofence} strokeColor={t.colors.accent} fillColor={`${t.colors.accent}33`} strokeWidth={2} />
                      ) : null}
                    </MapView>
                  </View>
                  {detail.address ? (
                    <Row style={{ padding: 14, gap: 8 }}>
                      <Icon name="location" size={16} color={t.colors.accent} />
                      <Text style={{ flex: 1, fontSize: 13 }}>{String(detail.address)}</Text>
                    </Row>
                  ) : null}
                </Card>
              </View>
            ) : null}

            {/* Rooms / areas measured with AR (properties), persisted on the backend.
                The property type drives which parts we suggest. */}
            {type === 'property' ? (
              <AssetParts assetId={assetId} propertyTypeId={detail.property_type_id ?? null} />
            ) : null}

            {/* Current mileage (vehicles). The reading *log* is history — it lives on
                the other tab; what stays here is the value and the act of recording it. */}
            {isVehicle ? (
              <View style={{ gap: 10 }}>
                <SectionLabel>{tr('assets.mileage')}</SectionLabel>
                <Card>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <View>
                      <Text variant="caption">{tr('assets.mileage')}</Text>
                      <Text weight="800" style={{ fontSize: 22 }}>
                        {detail.current_mileage != null ? fmtKm(Number(detail.current_mileage)) : tr('assets.mileageEmpty')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setKmOpen(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.colors.accentSoft, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 }}
                    >
                      <Icon name="plus" size={16} color={t.colors.accent} />
                      <Text variant="label" color={t.colors.accent}>{tr('assets.recordKm')}</Text>
                    </Pressable>
                  </Row>
                </Card>
              </View>
            ) : null}
          </>
        ) : (
          /* ── Histórico: one chronological list, newest first ─────────────── */
          <View style={{ gap: 10 }}>
            {events.length > 0 ? (
              events.map((e) => <TimelineRow key={e.key} event={e} onOpenRequest={(rid) => router.push(`/request/${rid}`)} />)
            ) : hasMore || fetchingMore ? null : (
              <EmptyState icon="wrench" title={tr('assets.timeline.empty')} body={tr('assets.timeline.emptyBody')} />
            )}

            {/* Honesty: while any source still has pages, older events may be missing
                from the merge. Say so instead of implying the list has ended. */}
            {hasMore || fetchingMore ? (
              <Row gap={8} style={{ justifyContent: 'center', paddingVertical: 12 }}>
                {fetchingMore ? <ActivityIndicator size="small" color={t.colors.accent} /> : null}
                <Text variant="caption">{tr(fetchingMore ? 'assets.timeline.loadingMore' : 'assets.timeline.more')}</Text>
              </Row>
            ) : null}
          </View>
        )}
      </View>

      <RecordKmSheet
        visible={kmOpen}
        onClose={() => setKmOpen(false)}
        onSubmit={submitKm}
        loading={addReading.isPending}
        services={services}
      />
    </Screen>
  );
}

/** Renders whichever kind of thing happened. The list above doesn't care which. */
function TimelineRow({ event, onOpenRequest }: { event: TimelineEvent; onOpenRequest: (id: number) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();

  if (event.kind === 'request') {
    return <RequestCard request={event.request} onPress={() => onOpenRequest(event.request.id)} />;
  }

  if (event.kind === 'reading') {
    const r = event.reading;
    return (
      <Card>
        <Row gap={10}>
          <Icon name="car" size={18} color={t.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text weight="700" style={{ fontSize: 14 }}>{fmtKm(r.mileage)}</Text>
            <Text variant="caption">
              {tr('assets.timeline.reading')} · {tr(`assets.source.${r.source}`)}
            </Text>
            {r.note ? <Text variant="caption" numberOfLines={1}>{r.note}</Text> : null}
          </View>
          <Text variant="caption">{fmtDate(r.recorded_at)}</Text>
        </Row>
      </Card>
    );
  }

  const p = event.part;
  return (
    <Card>
      <Row gap={10}>
        <Icon name="home" size={18} color={t.colors.accent} />
        <View style={{ flex: 1 }}>
          <Text weight="700" style={{ fontSize: 14 }}>{tr('assets.timeline.measured', { name: p.name })}</Text>
          {p.area != null ? (
            <Text variant="caption">
              {tr('assets.parts.summaryArea', { area: p.area.toFixed(1), perimeter: (p.perimeter ?? 0).toFixed(1) })}
            </Text>
          ) : null}
        </View>
        <Text variant="caption">{p.measured_at ? fmtDate(p.measured_at) : ''}</Text>
      </Row>
    </Card>
  );
}
