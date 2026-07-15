import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { SkeletonScreen,
  Asset,
  AvInit,
  BackBar,
  Badge,
  Button,
  Card,
  Icon,
  NotFoundView,
  RequestStatus,
  RequestUrgency,
  Row,
  Screen,
  SectionLabel,
  ServiceRequest,
  Stars,
  Text,
  brl,
  distanceLabel,
  etaLabel,
  etaMinutes,
  haversineKm,
  isActiveStatus,
  subscribeToRequest,
  useRoute,
  useTheme,
} from '@chamafacil/shared';
import { keys, useApprovePart, useApproveParts, useJobReport, useRequest, useRequestEvents, useTracking } from '../../../src/queries';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { EventFeed } from '../../../src/components/EventFeed';
import { ProposalsList } from '../../../src/components/ProposalsList';
import { ReceiptView } from '../../../src/components/ReceiptView';
import { ReviewForm } from '../../../src/components/ReviewForm';

const AV_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#0ea5e9'];
const initialsOf = (name?: string) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// Requests the user explicitly dismissed the rating modal for — resets on app
// reload (intentionally not persisted), just enough to stop nagging every
// time this screen regains focus in the same session.
const dismissedRatePrompts = new Set<number>();

export default function RequestDetail() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);

  const { data: request, isLoading } = useRequest(requestId);
  const isOpen = request?.status === RequestStatus.Open;
  const approve = useApproveParts(requestId);
  const approvePart = useApprovePart(requestId);
  const { parts: jobParts } = useJobReport(requestId);
  // Live tracking + event feed (lifted from the former /track screen).
  const trackable = request ? isActiveStatus(request.status) : false;
  const tracking = useTracking(requestId, trackable);
  const { data: events } = useRequestEvents(requestId);
  const [live, setLive] = useState<{ lat: number; lng: number } | null>(null);
  // ProposalsList wires this; the screen's scroll fires it to page in more bids.
  const proposalsLoadMore = useRef<(() => void) | null>(null);

  // Completed + unrated → rating prompt. Computed before the early returns so the
  // focus effect can re-open it whenever the screen regains focus.
  const [rateOpen, setRateOpen] = useState(false);
  const canReview = request?.status === RequestStatus.Completed && !request?.review;

  // Road route (OSRM) from the provider's live position to the job, for the map.
  const routeFrom = live
    ? { latitude: live.lat, longitude: live.lng }
    : tracking.data?.latitude != null && tracking.data?.longitude != null
      ? { latitude: tracking.data.latitude, longitude: tracking.data.longitude }
      : null;
  const route = useRoute(
    trackable ? routeFrom : null,
    trackable && request ? { latitude: request.latitude, longitude: request.longitude } : null,
  );

  useEffect(() => {
    let off: (() => void) | undefined;
    const refresh = () => {
      qc.invalidateQueries({ queryKey: keys.request(requestId) });
      qc.invalidateQueries({ queryKey: keys.events(requestId) });
    };
    subscribeToRequest(requestId, {
      onProposal: () => {
        qc.invalidateQueries({ queryKey: ['proposals', requestId] });
        refresh();
      },
      onStatus: refresh,
      onPartsApprovalRequested: refresh,
      onPartsApproved: refresh,
      onSurchargeProposed: refresh,
      onSurchargeResolved: refresh,
      onRescheduleRequested: refresh,
      onRescheduleResolved: refresh,
      onDispute: refresh,
      onLocation: (e) => setLive({ lat: e.latitude, lng: e.longitude }),
    }).then((fn) => (off = fn));
    return () => off?.();
  }, [requestId, qc]);

  // Re-prompt the rating each time a completed, unrated request regains focus.
  useFocusEffect(useCallback(() => {
    if (canReview && !dismissedRatePrompts.has(requestId)) setRateOpen(true);
  }, [canReview, requestId]));

  const dismissRate = () => {
    dismissedRatePrompts.add(requestId);
    setRateOpen(false);
  };

  if (isLoading) return <SkeletonScreen />;
  if (!request) {
    return (
      <NotFoundView
        showBackBar
        icon="wrench"
        title={tr('notFound.request.title')}
        body={tr('notFound.request.body')}
        homeLabel={tr('notFound.home')}
        onHome={() => router.replace('/(tabs)/requests')}
        backLabel={tr('common.back')}
        onBack={router.canGoBack() ? () => router.back() : undefined}
      />
    );
  }

  const categoryName = request.category ? tr(`categories.${request.category.slug}`, { defaultValue: request.category.name }) : undefined;
  const active = isActiveStatus(request.status);
  const isRequote = request.status === RequestStatus.Requote;
  const isCompleted = request.status === RequestStatus.Completed;
  const pendingSurcharge = request.surcharges?.find((s) => s.status === 'pending');
  const pendingReschedule = request.reschedule_requests?.find((r) => r.status === 'pending' && r.requested_by_role === 'provider');
  const statusText = tr(`enums.requestStatus.${request.status}`);

  // Live-tracking view model (only rendered while the job is active).
  const provLat = live?.lat ?? tracking.data?.latitude;
  const provLng = live?.lng ?? tracking.data?.longitude;
  // Frame both the job and the provider while en route; otherwise center on the job.
  const region: Region =
    provLat != null && provLng != null
      ? {
          latitude: (request.latitude + provLat) / 2,
          longitude: (request.longitude + provLng) / 2,
          latitudeDelta: Math.max(0.02, Math.abs(request.latitude - provLat) * 2.4),
          longitudeDelta: Math.max(0.02, Math.abs(request.longitude - provLng) * 2.4),
        }
      : { latitude: request.latitude, longitude: request.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  // Distance/ETA recomputed from the live position (socket-driven) → no polling needed.
  const provAvailable = provLat != null && provLng != null;
  const provKm = provAvailable ? haversineKm(request.latitude, request.longitude, provLat!, provLng!) : null;
  const provEta = provKm != null ? etaMinutes(provKm) : null;
  // Prefer the OSRM road distance/duration when the route is available.
  const showKm = route?.distanceKm ?? provKm;
  const showEta = route?.durationMin ?? provEta;
  const trackStep = request.status === RequestStatus.InProgress ? 2 : request.status === RequestStatus.Completed ? 3 : 1;
  const trackSteps = [tr('tracking.stepAccepted'), tr('tracking.stepOnWay'), tr('tracking.stepArrived'), tr('tracking.stepDone')];

  return (
    <Screen
      stickyHeader
      padded={false}
      onEndReached={isOpen ? () => proposalsLoadMore.current?.() : undefined}
      footer={canReview ? <Button title={tr('rate.promptCta')} full onPress={() => setRateOpen(true)} /> : undefined}
    >
      <BackBar
        title={categoryName ?? tr('requestDetail.fallbackTitle')}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/requests'))}
        right={<Badge label={statusText} tone={isOpen ? 'open' : active ? 'live' : 'neutral'} dot={active || isOpen} />}
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
        <Card>
          <Row>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <CategoryIcon category={request.category} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="800" style={{ fontSize: 15.5 }} numberOfLines={1}>
                {request.category ? `${tr(`enums.categoryType.${request.category.type}`)} · ${categoryName}` : tr('requestDetail.fallbackTitle')}
              </Text>
              {request.address && <Text variant="caption" numberOfLines={1}>{request.address}</Text>}
            </View>
            {request.urgency === RequestUrgency.Urgent && (
              <Badge
                label={request.max_wait_minutes != null ? tr('enums.urgency.urgentWithWait', { count: request.max_wait_minutes }) : tr('enums.urgency.urgent')}
                tone="urgent"
                dot
              />
            )}
          </Row>
        </Card>

        {request.asset && <RequestAssetCard asset={request.asset} onPress={() => router.push(`/assets/${request.asset!.id}`)} />}

        {(request.before_photos?.length || request.after_photos?.length) ? <JobPhotosView request={request} /> : null}

        {/* Pre-bid Q&A now renders inside each bid (see ProposalsList / ProposalCard). */}
        {isOpen && (
          <ProposalsList
            requestId={requestId}
            budget={request.budget_max}
            maxWaitMinutes={request.urgency === RequestUrgency.Urgent ? request.max_wait_minutes : null}
            loadMoreRef={proposalsLoadMore}
          />
        )}

        {active && (
          <View style={{ gap: 14 }}>
            {/* Live map + ETA + progress strip (formerly the /track screen). */}
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <MapView style={{ height: 220 }} region={region}>
                {route && <Polyline coordinates={route.coords} strokeColor={t.colors.accent} strokeWidth={5} />}
                <Marker coordinate={{ latitude: request.latitude, longitude: request.longitude }} pinColor={t.colors.accent} title={tr('requestDetail.fallbackTitle')} />
                {provLat != null && provLng != null && (
                  <Marker coordinate={{ latitude: provLat, longitude: provLng }} pinColor={t.colors.ok} title={request.provider?.name} />
                )}
              </MapView>
              <View style={{ padding: 16 }}>
                <Row>
                  <Icon name="navigate" size={22} color={t.colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text weight="800" style={{ fontSize: 17 }}>{provAvailable ? distanceLabel(showKm) : tr('tracking.subtitle')}</Text>
                    <Text variant="caption">{provAvailable ? tr('tracking.arrivingIn', { eta: etaLabel(showEta) }) : tr('tracking.unavailable')}</Text>
                  </View>
                  <Badge label={tr('tracking.live')} tone="live" dot />
                </Row>
              </View>
            </Card>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 6 }}>
              {trackSteps.map((label, i) => {
                const done = i < trackStep;
                const now = i === trackStep;
                return (
                  <React.Fragment key={i}>
                    <View style={{ alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: done || now ? 0 : 1, borderColor: t.colors.line, backgroundColor: done || now ? t.colors.accent : t.colors.surface2 }}>
                        {done ? <Icon name="check" size={13} color={t.colors.accentInk} /> : <Text weight="800" style={{ fontSize: 12, color: now ? '#fff' : t.colors.ink3 }}>{i + 1}</Text>}
                      </View>
                      <Text style={{ fontSize: 10.5, fontWeight: '700' }} color={done || now ? t.colors.ink : t.colors.ink3}>{label}</Text>
                    </View>
                    {i < trackSteps.length - 1 && <View style={{ flex: 1, height: 2, marginTop: 12, backgroundColor: i < trackStep ? t.colors.accent : t.colors.line }} />}
                  </React.Fragment>
                );
              })}
            </View>

            {request.provider && (
              <Card>
                <Row>
                  <AvInit initials={initialsOf(request.provider.name)} color={AV_COLORS[0]} />
                  <View style={{ flex: 1 }}>
                    <Text weight="800" style={{ fontSize: 15.5 }}>{request.provider.name}</Text>
                    {request.provider.rating_avg != null && <Stars value={request.provider.rating_avg} size={13} />}
                  </View>
                </Row>
              </Card>
            )}
            {/* Start-of-service code (C17): read it to the provider on arrival. */}
            {request.start_code && (
              <Card style={{ gap: 6, borderWidth: 1.5, borderColor: t.colors.accent, alignItems: 'center' }}>
                <Text variant="label" color={t.colors.ink2}>{tr('requestDetail.startCodeLabel')}</Text>
                <Text weight="800" style={{ fontSize: 30, letterSpacing: 6, color: t.colors.accent }}>{request.start_code}</Text>
                <Text variant="caption" center>{tr('requestDetail.startCodeHint')}</Text>
              </Card>
            )}
            {request.parts_approval_requested && !request.parts_approved && (
              <Card style={{ gap: 10, borderWidth: 1.5, borderColor: t.colors.accent }}>
                <Row gap={10}>
                  <Icon name="shieldCheck" size={20} color={t.colors.accent} />
                  <Text weight="800" style={{ flex: 1, fontSize: 14.5 }}>{tr('requestDetail.approvalTitle')}</Text>
                </Row>
                <Text variant="caption">{tr('requestDetail.approvalBody')}</Text>
                {(jobParts.data ?? []).length > 0 && (
                  <View style={{ gap: 6 }}>
                    {(jobParts.data ?? []).map((p) => (
                      <Row key={p.id} style={{ paddingVertical: 6, borderTopWidth: 1, borderColor: t.colors.line }}>
                        <View style={{ flex: 1 }}>
                          <Text weight="700" style={{ fontSize: 13.5 }}>{p.quantity}× {p.name}</Text>
                          {p.unit_price != null && <Text variant="caption">{brl(p.unit_price * p.quantity)}</Text>}
                        </View>
                        {p.approved_at ? (
                          <Row gap={4}>
                            <Icon name="check" size={14} color={t.colors.ok} />
                            <Text variant="caption" weight="700" color={t.colors.ok}>{tr('requestDetail.partApproved')}</Text>
                          </Row>
                        ) : (
                          <Text weight="700" color={t.colors.accent} style={{ fontSize: 12.5 }} onPress={() => approvePart.mutate(p.id)}>
                            {tr('requestDetail.approve')}
                          </Text>
                        )}
                      </Row>
                    ))}
                  </View>
                )}
                <Button title={tr('requestDetail.approveAll')} full loading={approve.isPending} onPress={() => approve.mutate()} />
              </Card>
            )}
            {request.parts_approved && (
              <Row gap={8} style={{ backgroundColor: t.colors.okSoft, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
                <Icon name="check" size={16} color={t.colors.ok} />
                <Text weight="700" color={t.colors.ok} style={{ fontSize: 13.5 }}>{tr('requestDetail.approvedDone')}</Text>
              </Row>
            )}
            {pendingSurcharge && (
              <Card onPress={() => router.push(`/request/${requestId}/surcharge`)} style={{ gap: 8, borderWidth: 1.5, borderColor: t.colors.danger }}>
                <Row gap={10}>
                  <Icon name="flash" size={20} color={t.colors.danger} />
                  <Text weight="800" style={{ flex: 1, fontSize: 14.5 }}>{tr('actions.surcharge.proposedTitle')}</Text>
                  <Text weight="800" color={t.colors.danger}>{brl(pendingSurcharge.amount)}</Text>
                </Row>
                <Text variant="caption" numberOfLines={1}>{pendingSurcharge.reason}</Text>
              </Card>
            )}
            {pendingReschedule && (
              <Button title={tr('actions.reschedule.incomingTitle')} variant="soft" full onPress={() => router.push(`/request/${requestId}/reschedule`)} left={<Icon name="calendar" size={16} color={t.colors.accent} />} />
            )}
            <Row gap={14} style={{ justifyContent: 'center' }}>
              <Text weight="700" color={t.colors.ink3} style={{ fontSize: 12.5 }} onPress={() => router.push(`/request/${requestId}/reschedule`)}>{tr('actions.reschedule.title')}</Text>
              <Text weight="700" color={t.colors.ink3} style={{ fontSize: 12.5 }} onPress={() => router.push(`/request/${requestId}/no-show`)}>{tr('actions.noShow.title')}</Text>
            </Row>
          </View>
        )}

        {isRequote && (
          <Card onPress={() => router.push(`/request/${requestId}/requote`)} style={{ gap: 8, borderWidth: 1.5, borderColor: t.colors.danger }}>
            <Row gap={10}>
              <Icon name="edit" size={20} color={t.colors.danger} />
              <Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.requote.title')}</Text>
            </Row>
            <Text variant="caption">{tr('actions.requote.explain')}</Text>
            <Button title={tr('actions.requote.title')} variant="soft" full onPress={() => router.push(`/request/${requestId}/requote`)} />
          </Card>
        )}

        {/* Completed → receipt + consolidated summary. Rating is prompted on top (modal below). */}
        {isCompleted && <ReceiptView request={request} />}
        {isCompleted && <CompletedSummary request={request} />}
        {isCompleted && (
          <Row gap={10}>
            <View style={{ flex: 1 }}>
              <Button title={tr('actions.warranty.title')} variant="ghost" full onPress={() => router.push(`/request/${requestId}/warranty`)} left={<Icon name="shieldCheck" size={16} color={t.colors.ink} />} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={tr('actions.dispute.title')} variant="ghost" full onPress={() => router.push(`/request/${requestId}/dispute`)} left={<Icon name="shield" size={16} color={t.colors.ink} />} />
            </View>
          </Row>
        )}

        <EventFeed events={events ?? []} approvedValue={request.accepted_proposal?.price} />
      </View>

      {/* Rating prompt: opens on top when completed+unrated, re-prompts on focus
          until dismissed once, closeable. */}
      <Modal visible={rateOpen} transparent animationType="slide" onRequestClose={dismissRate}>
        <Pressable onPress={dismissRate} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12, maxHeight: '92%' }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line, marginBottom: 6 }} />
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
              <Row style={{ marginBottom: 8 }}>
                <Text weight="800" style={{ flex: 1, fontSize: 17 }}>{tr('rate.title')}</Text>
                <Pressable onPress={dismissRate} hitSlop={8}><Icon name="close" size={22} color={t.colors.ink3} /></Pressable>
              </Row>
              <ReviewForm requestId={requestId} request={request} onSubmitted={() => setRateOpen(false)} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const ASSET_ICON: Record<string, string> = { vehicle: 'car', property: 'home', pet: 'paw' };

/** The asset (vehicle/property/pet) this request is tied to — brand logo + caption. */
function RequestAssetCard({ asset, onPress }: { asset: Asset; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const d = asset.detail ?? {};
  const caption =
    [d.make, d.model, d.plate, d.kind, d.unit, d.species, d.breed].filter(Boolean).join(' · ') ||
    tr(`assets.type.${asset.type}`);
  return (
    <Card onPress={onPress}>
      <Row gap={12}>
        <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          {d.make_logo_url ? (
            <Image source={{ uri: d.make_logo_url }} style={{ width: 32, height: 32 }} resizeMode="contain" />
          ) : (
            <Icon name={ASSET_ICON[asset.type] ?? 'car'} size={22} color={t.colors.accent} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="caption" weight="700" color={t.colors.ink3}>{tr('requestDetail.assetLabel')}</Text>
          <Text weight="800" style={{ fontSize: 14.5 }}>{asset.nickname}</Text>
          <Text variant="caption" numberOfLines={1}>{caption}</Text>
        </View>
        <Icon name="arrowR" size={18} color={t.colors.ink3} />
      </Row>
    </Card>
  );
}

/** Consolidated summary shown when a request is completed: provider, timeline, parts. */
function CompletedSummary({ request }: { request: ServiceRequest }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const fmt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }) : null;
  const parts = request.job_parts ?? [];
  const timeline = [
    { k: tr('requestDetail.tlAccepted'), v: fmt(request.accepted_at) },
    { k: tr('requestDetail.tlStarted'), v: fmt(request.started_at) },
    { k: tr('requestDetail.tlCompleted'), v: fmt(request.completed_at) },
  ].filter((x) => x.v);

  return (
    <View style={{ gap: 14 }}>
      <SectionLabel>{tr('requestDetail.summaryLabel')}</SectionLabel>

      {request.provider && (
        <Card>
          <Row>
            <AvInit initials={initialsOf(request.provider.name)} color={AV_COLORS[0]} />
            <View style={{ flex: 1 }}>
              <Text variant="caption" weight="700" color={t.colors.ink3}>{tr('requestDetail.servedBy')}</Text>
              <Text weight="800" style={{ fontSize: 15 }}>{request.provider.name}</Text>
              {request.provider.rating_avg != null && <Stars value={request.provider.rating_avg} size={13} />}
            </View>
          </Row>
        </Card>
      )}

      {timeline.length > 0 && (
        <Card style={{ gap: 8 }}>
          {timeline.map((x) => (
            <Row key={x.k}>
              <Text variant="caption" weight="700" style={{ flex: 1 }}>{x.k}</Text>
              <Text weight="700" style={{ fontSize: 13.5 }}>{x.v}</Text>
            </Row>
          ))}
        </Card>
      )}

      {parts.length > 0 && (
        <View style={{ gap: 8 }}>
          <SectionLabel count={parts.length}>{tr('requestDetail.partsUsed')}</SectionLabel>
          <Card padded={false} style={{ paddingHorizontal: 16 }}>
            {parts.map((p, i) => (
              <Row key={p.id} style={{ paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderColor: t.colors.line, gap: 12 }}>
                <Text weight="700" style={{ flex: 1, fontSize: 14 }}>{p.quantity}× {p.name}</Text>
                <Text weight="700" style={{ fontSize: 13.5 }}>{p.unit_price != null ? brl(p.unit_price * p.quantity) : '—'}</Text>
              </Row>
            ))}
          </Card>
        </View>
      )}
    </View>
  );
}

/** Read-only before/after photos the provider shared. */
function JobPhotosView({ request }: { request: { before_photos?: { id: number; url: string }[]; after_photos?: { id: number; url: string }[] } }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const col = (label: string, photos: { id: number; url: string }[]) => (
    <View style={{ flex: 1, gap: 8 }}>
      <Text variant="label" color={t.colors.ink2}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {photos.length ? (
          photos.map((p) => <Image key={p.id} source={{ uri: p.url }} style={{ width: 72, height: 72, borderRadius: 12 }} />)
        ) : (
          <Text variant="caption" color={t.colors.ink3}>—</Text>
        )}
      </View>
    </View>
  );
  return (
    <View style={{ gap: 10 }}>
      <SectionLabel>{tr('requestDetail.beforeAfter')}</SectionLabel>
      <Row style={{ alignItems: 'flex-start', gap: 14 }}>
        {col(tr('requestDetail.beforeLabel'), request.before_photos ?? [])}
        {col(tr('requestDetail.afterLabel'), request.after_photos ?? [])}
      </Row>
    </View>
  );
}
