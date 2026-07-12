import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Card, EmptyState, FieldDisplay, Icon, NotFoundView, Row, Screen, SectionLabel, Text, useTheme } from '@chamafacil/shared';
import { useAddReading, useAsset, useAssetHistory, useAssetReadings } from '../../../src/queries';
import { ASSET_FIELDS, AssetTypeKey } from '../../../src/assetFields';
import { RequestCard } from '../../../src/components/RequestCard';
import { RecordKmSheet } from '../../../src/components/RecordKmSheet';

const ICON: Record<string, string> = { vehicle: 'car', property: 'home', pet: 'paw' };

/** Asset detail (R6): photo, read-only characteristics, mileage, and the
 *  consolidated service history. Editing lives on the separate edit screen. */
export default function AssetDetail() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assetId = Number(id);

  const { data: asset, isLoading } = useAsset(assetId);
  const isVehicle = asset?.type === 'vehicle';
  const readingsQ = useAssetReadings(assetId, !!isVehicle);
  const historyQ = useAssetHistory(assetId);
  const addReading = useAddReading(assetId);
  const [kmOpen, setKmOpen] = useState(false);

  if (isLoading) {
    return (
      <Screen stickyHeader scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </Screen>
    );
  }
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

  const readings = (readingsQ.data?.pages ?? []).flatMap((p) => p.data);
  const history = (historyQ.data?.pages ?? []).flatMap((p) => p.data);
  const services = history.slice(0, 8).map((r) => ({ id: r.id, label: r.category ? tr(`categories.${r.category.slug}`, { defaultValue: r.category.name }) : `#${r.id}` }));
  const fmtKm = (n: number) => `${n.toLocaleString('pt-BR')} km`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

  const submitKm = (payload: { mileage: number; note?: string; service_request_id?: number }) =>
    addReading.mutate(payload, { onSuccess: () => setKmOpen(false) });

  return (
    <Screen stickyHeader padded={false} onEndReached={() => historyQ.hasNextPage && historyQ.fetchNextPage()}>
      <BackBar
        title={asset.nickname}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/assets'))}
        right={
          <Pressable onPress={() => router.push(`/assets/${assetId}/edit`)} hitSlop={8} accessibilityRole="button">
            <Text variant="label" color={t.colors.accent}>{tr('assets.edit')}</Text>
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16 }}>
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

        {/* Mileage (vehicles) — current value + append-only readings log */}
        {isVehicle ? (
          <View style={{ gap: 10 }}>
            <SectionLabel>{tr('assets.kmHistory')}</SectionLabel>
            <Card style={{ gap: 12 }}>
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

              {readings.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {readings.map((r) => (
                    <Row key={r.id} style={{ justifyContent: 'space-between', borderTopWidth: 1, borderColor: t.colors.line, paddingTop: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text weight="700" style={{ fontSize: 14 }}>{fmtKm(r.mileage)}</Text>
                        {r.note ? <Text variant="caption" numberOfLines={1}>{r.note}</Text> : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text variant="caption">{fmtDate(r.recorded_at)}</Text>
                        <Text variant="caption" color={r.source === 'provider' ? t.colors.accent : t.colors.ink3}>
                          {tr(`assets.source.${r.source}`)}
                        </Text>
                      </View>
                    </Row>
                  ))}
                </View>
              ) : (
                <Text variant="caption">{tr('assets.kmNone')}</Text>
              )}
            </Card>
          </View>
        ) : null}

        {/* Service history */}
        <View style={{ gap: 10 }}>
          <SectionLabel>{tr('assets.history')}</SectionLabel>
          {history.length > 0 ? (
            history.map((r) => <RequestCard key={r.id} request={r} onPress={() => router.push(`/request/${r.id}`)} />)
          ) : (
            <EmptyState icon="wrench" title={tr('assets.historyEmpty')} body="" />
          )}
        </View>
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
