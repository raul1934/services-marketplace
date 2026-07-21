import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, View, ViewStyle } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { SkeletonScreen,
  AnswerList,
  Asset,
  AvInit,
  BackBar,
  Badge,
  Button,
  Card,
  Icon,
  IconName,
  NotFoundView,
  RequestStatus,
  RequestUrgency,
  Row,
  Screen,
  SectionLabel,
  Segment,
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
  TestBanner, // TEMP — test bots. Remove with backend app/Bots.
  useRoute,
  useTheme,
} from '@chamafacil/shared';
import { keys, useApprovePart, useApproveParts, useJobReport, useRequest, useRequestEvents, useTracking } from '../../../src/queries';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { EventFeed } from '../../../src/components/EventFeed';
import { JobSubject } from '../../../src/components/JobSubject';
import { ProposalsList } from '../../../src/components/ProposalsList';
import { ReceiptView } from '../../../src/components/ReceiptView';
import { ReviewForm } from '../../../src/components/ReviewForm';

const AV_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#0ea5e9'];
const initialsOf = (name?: string) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

type RequestTab = 'tracking' | 'request' | 'history';

/** How long the map stays where the user left it before snapping back. */
const RECENTER_DELAY_MS = 10_000;

/**
 * Whether two regions are close enough to be "the same view".
 *
 * The map reports every region change through onRegionChangeComplete —
 * including the ones we cause by re-centering. Without this check, our own
 * recenter would look like a user gesture, re-arm the timer, and loop forever.
 * Tolerances are relative to the delta so they hold at any zoom level.
 */
function isSameRegion(a: Region, b: Region): boolean {
  const tolLat = Math.max(Math.abs(b.latitudeDelta) * 0.05, 1e-5);
  const tolLng = Math.max(Math.abs(b.longitudeDelta) * 0.05, 1e-5);
  const sameZoom =
    b.latitudeDelta > 0 ? (() => { const r = a.latitudeDelta / b.latitudeDelta; return r > 0.75 && r < 1.33; })() : true;

  return (
    Math.abs(a.latitude - b.latitude) < tolLat &&
    Math.abs(a.longitude - b.longitude) < tolLng &&
    sameZoom
  );
}

/**
 * The live tracking map, which follows the job and the provider — but yields to
 * the user.
 *
 * Panning or zooming used to be pointless here: the region prop is recomputed on
 * every provider location update (they arrive over the websocket every few
 * seconds), so the map snapped back almost immediately. Now a user gesture
 * suspends the follow for {RECENTER_DELAY_MS}, then it re-frames both points.
 *
 * Both platforms run Leaflet (see the react-native-maps alias in
 * metro.config.js — a WebView impl on native, a DOM stub on web), and BOTH sync
 * the controlled `region` off primitive lat/lng/delta deps. So the prop alone
 * cannot bring the map back when the user panned away and the target hasn't
 * moved meanwhile — the primitives are unchanged, and the sync effect never
 * re-runs.
 *
 * Hence: controlled region to follow the target, plus an imperative
 * animateToRegion to force the snap-back. Native exposes that through the class
 * ref; the web stub is a plain function component with no ref, so there the
 * snap-back only lands when the target also moved. Native — the shipped app —
 * always re-centers.
 */
function TrackingMap({
  target,
  style,
  children,
}: {
  target: Region;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = target;
  const [view, setView] = useState<Region>(target);
  const [userMoved, setUserMoved] = useState(false);
  // The last region WE applied, to tell our own moves from the user's.
  const applied = useRef<Region>(target);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<MapView | null>(null);

  // Follow the job/provider, unless the user is currently driving the map.
  useEffect(() => {
    if (userMoved) return;
    const next = { latitude, longitude, latitudeDelta, longitudeDelta };
    applied.current = next;
    setView(next);
    // The prop sync alone is not enough when the user panned but the target
    // stands still: the impls key on primitives, which haven't changed. Nudging
    // it imperatively is what actually brings the map back. No-op on web.
    mapRef.current?.animateToRegion?.(next, 400);
  }, [latitude, longitude, latitudeDelta, longitudeDelta, userMoved]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onRegionChangeComplete = (r: Region) => {
    if (isSameRegion(r, applied.current)) return; // our own recenter echoing back
    setUserMoved(true);
    if (timer.current) clearTimeout(timer.current);
    // Flipping userMoved back to false re-runs the effect above, which re-frames.
    timer.current = setTimeout(() => setUserMoved(false), RECENTER_DELAY_MS);
  };

  return (
    <MapView ref={mapRef} style={style} region={view} onRegionChangeComplete={onRegionChangeComplete}>
      {children}
    </MapView>
  );
}

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
  const insets = useSafeAreaInsets();

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

  // Three tabs so the screen answers one question at a time: what's happening
  // now, what was asked for, and what already happened. Defaults to tracking —
  // the reason someone opens this screen mid-job.
  const [tab, setTab] = useState<RequestTab>('tracking');

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
    let cancelled = false;
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
      // Parts and notes landing while the provider works — this is what makes
      // the on-site panel fill in live instead of on pull-to-refresh.
      onProgress: refresh,
      onPartsApprovalRequested: refresh,
      onPartsApproved: refresh,
      onSurchargeProposed: refresh,
      onSurchargeResolved: refresh,
      onRescheduleRequested: refresh,
      onRescheduleResolved: refresh,
      onDispute: refresh,
      onLocation: (e) => setLive({ lat: e.latitude, lng: e.longitude }),
    })
      // Subscribing is async: if the screen unmounts (or the socket is rebuilt
      // after a token change) before it resolves, drop the subscription instead
      // of leaving it registered on a screen that is gone.
      .then((fn) => (cancelled ? fn() : (off = fn)))
      .catch(() => {
        /* realtime is additive — pull-to-refresh and push still deliver */
      });
    return () => {
      cancelled = true;
      off?.();
    };
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
  // Provider is here and working — swap the map for the work itself.
  const onSite = request.status === RequestStatus.InProgress;
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
      onEndReached={isOpen && tab === 'tracking' ? () => proposalsLoadMore.current?.() : undefined}
      // Tabs live in the pinned footer, thumb-reachable and always visible —
      // at the top of a long scroll they were out of reach exactly when you'd
      // want to switch. The review CTA stacks above them when it applies.
      footer={
        <View style={{ gap: 10 }}>
          {canReview && <Button title={tr('rate.promptCta')} full onPress={() => setRateOpen(true)} />}
          <Segment
            value={tab}
            onChange={setTab}
            items={[
              { value: 'tracking', label: tr('requestDetail.tabs.tracking'), icon: 'navigate' },
              { value: 'request', label: tr('requestDetail.tabs.request'), icon: 'list' },
              { value: 'history', label: tr('requestDetail.tabs.history'), icon: 'clock' },
            ]}
          />
        </View>
      }
    >
      {/* Screen pins its FIRST child when stickyHeader is set, so wrapping the
          bar and the stepper together keeps both on screen while the body
          scrolls — the progress is the one thing you always want visible. */}
      <View>
        <BackBar
          backLabel={tr('common.back')}
          title={categoryName ?? tr('requestDetail.fallbackTitle')}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/requests'))}
          right={<Badge label={statusText} tone={isOpen ? 'open' : active ? 'live' : 'neutral'} dot={active || isOpen} />}
        />
        {active && <TrackSteps steps={trackSteps} current={trackStep} />}
        {/* What the job is about, pinned: mid-job "is this the right car?" and
            "did I show him the right thing?" shouldn't cost you the tab you're
            watching. Renders nothing when there's no asset and no photos. */}
        <JobSubject
          asset={request.asset}
          photos={request.photos}
          onPressAsset={request.asset ? () => router.push(`/assets/${request.asset!.id}`) : undefined}
        />
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
        {/* TEMP — test bots. Remove with backend app/Bots. */}
        {request.is_test && <TestBanner message="Chamado de teste gerado por bot." />}

        {/* Context header, above the tabs so it stays true whichever tab is open.
            The urgency badge sits on its own line rather than sharing the row
            with the title: "Urgente · 30 min" is wide, and competing for width
            was truncating the category the request is actually about. */}
        <Card>
          <Row gap={12} style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <CategoryIcon category={request.category} size={24} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text weight="800" style={{ fontSize: 15.5 }} numberOfLines={2}>
                {request.category ? `${tr(`enums.categoryType.${request.category.type}`)} · ${categoryName}` : tr('requestDetail.fallbackTitle')}
              </Text>
              {request.address && <Text variant="caption" numberOfLines={1}>{request.address}</Text>}
              {request.urgency === RequestUrgency.Urgent && (
                <Badge
                  label={request.max_wait_minutes != null ? tr('enums.urgency.urgentWithWait', { count: request.max_wait_minutes }) : tr('enums.urgency.urgent')}
                  tone="urgent"
                  dot
                />
              )}
            </View>
          </Row>
        </Card>

        {/* ── Tab: Solicitação — what was asked for ─────────────── */}
        {tab === 'request' && (
          <View style={{ gap: 14 }}>
            {/* Asset and the client's photos moved to the pinned JobSubject
                strip, so they're on every tab instead of only this one. */}
            <Card style={{ gap: 0 }}>
              <DetailRow label={tr('requestDetail.descriptionLabel')} value={request.description} first />
              {request.address && <DetailRow label={tr('requestDetail.addressLabel')} value={request.address} />}
              {request.budget_max != null && (
                <DetailRow label={tr('requestDetail.budgetLabel')} value={brl(request.budget_max)} />
              )}
              {/* `payment.*`, not `enums.paymentMethod.*` — the latter doesn't exist
                  and rendered the raw key on screen. Same namespace ReceiptView uses. */}
              {request.payment_method && (
                <DetailRow label={tr('requestDetail.paymentLabel')} value={tr(`payment.${request.payment_method}`)} />
              )}
            </Card>

            {request.answers?.length ? (
              <View style={{ gap: 8 }}>
                <SectionLabel count={request.answers.length}>{tr('requestDetail.answersLabel')}</SectionLabel>
                <Card><AnswerList answers={request.answers} /></Card>
              </View>
            ) : null}

            {(request.before_photos?.length || request.after_photos?.length) ? <JobPhotosView request={request} /> : null}
          </View>
        )}

        {/* ── Tab: Histórico — everything that already happened ──── */}
        {tab === 'history' && <EventFeed events={events ?? []} variant="table" />}

        {/* ── Tab: Acompanhamento — the current state of the job ── */}
        {tab === 'tracking' && (
          <View style={{ gap: 14 }}>
          {/* The money, stated once and plainly — it used to be a caption hidden
              in the event feed's header. */}
          {request.accepted_proposal && <ApprovedValueCard request={request} />}

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
              {/* En route → map + ETA. On site → what's being done instead: the map
                answers "where is he", which stops being a question once he's
                here. The stepper in the header still carries the status. */}
              {onSite ? (
                <JobProgressPanel request={request} />
              ) : (
                <Card padded={false} style={{ overflow: 'hidden' }}>
                  <TrackingMap target={region} style={{ height: 220 }}>
                    {route && <Polyline coordinates={route.coords} strokeColor={t.colors.accent} strokeWidth={5} />}
                    <Marker coordinate={{ latitude: request.latitude, longitude: request.longitude }} pinColor={t.colors.accent} title={tr('requestDetail.fallbackTitle')} />
                    {provLat != null && provLng != null && (
                      <Marker coordinate={{ latitude: provLat, longitude: provLng }} pinColor={t.colors.ok} title={request.provider?.name} />
                    )}
                  </TrackingMap>
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
              )}

              {/* The stepper moved to the pinned header (see TrackSteps). */}
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
              {/* Pre-arrival escape hatches. The server decides when they apply
                  (ServiceRequest::canReschedule / canReportNoShow) and says so in
                  the payload — the app only renders that answer, so the two can't
                  drift. One per row: side by side, "Profissional não apareceu"
                  wrapped to two lines and the pair read as one control. */}
              {(request.can_reschedule || request.can_report_no_show) && (
                <View style={{ gap: 8 }}>
                  <SectionLabel>{tr('requestDetail.actionsLabel')}</SectionLabel>
                  {request.can_reschedule && (
                    <Button
                      title={tr('actions.reschedule.title')}
                      variant="ghost"
                      full
                      onPress={() => router.push(`/request/${requestId}/reschedule`)}
                      left={<Icon name="calendar" size={16} color={t.colors.ink} />}
                    />
                  )}
                  {request.can_report_no_show && (
                    <Button
                      title={tr('actions.noShow.title')}
                      variant="ghost"
                      full
                      onPress={() => router.push(`/request/${requestId}/no-show`)}
                      left={<Icon name="userX" size={16} color={t.colors.ink} />}
                    />
                  )}
                </View>
              )}

              {/* Still inside the promised window: say when the options unlock
                  rather than showing dead buttons or nothing at all. */}
              {!request.can_reschedule && !request.can_report_no_show && !onSite && request.arrival_deadline && (
                <Row gap={8} style={{ paddingHorizontal: 4 }}>
                  <Icon name="clock" size={14} color={t.colors.ink3} />
                  <Text variant="caption" color={t.colors.ink3} style={{ flex: 1 }}>
                    {tr('requestDetail.actionsLockedUntil', {
                      time: new Date(request.arrival_deadline).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    })}
                  </Text>
                </Row>
              )}
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

          </View>
        )}
      </View>

      {/* Rating prompt: opens on top when completed+unrated, re-prompts on focus
          until dismissed once, closeable. */}
      <Modal visible={rateOpen} transparent animationType="slide" onRequestClose={dismissRate}>
        <Pressable onPress={dismissRate} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12, maxHeight: '92%' }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line, marginBottom: 6 }} />
            {/* The sheet reaches the bottom of the screen, so a fixed padding
                left the submit button under Android's navigation bar. Pad by
                the real inset instead. */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 + insets.bottom }}>
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

/**
 * Job progress: Aceito → A caminho → Chegou → Concluído.
 *
 * Lives in the screen's pinned header rather than in the scroll body, so "where
 * is this job right now" stays on screen while you read bids, parts or history.
 * Sized down from the in-body version it replaced (26px dots → 22px) to earn its
 * permanent place without crowding the title.
 */
function TrackSteps({ steps, current }: { steps: string[]; current: number }) {
  const t = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 22, paddingBottom: 12 }}>
      {steps.map((label, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <React.Fragment key={i}>
            <View style={{ alignItems: 'center', gap: 5 }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: done || now ? 0 : 1,
                  borderColor: t.colors.line,
                  backgroundColor: done || now ? t.colors.accent : t.colors.surface2,
                }}
              >
                {done ? (
                  <Icon name="check" size={11} color={t.colors.accentInk} />
                ) : (
                  <Text weight="800" style={{ fontSize: 11, lineHeight: 14, color: now ? '#fff' : t.colors.ink3 }}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                style={{ fontSize: 10, lineHeight: 13, fontWeight: '700' }}
                color={done || now ? t.colors.ink : t.colors.ink3}
              >
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={{ flex: 1, height: 2, marginTop: 10, backgroundColor: i < current ? t.colors.accent : t.colors.line }} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

/**
 * What the provider is doing, shown once they're on site.
 *
 * Replaces the map at that point: the map answers "where is he", which stops
 * being a question the moment he arrives. From then on the live question is
 * "what is he doing to my thing" — parts going on the bill, notes and photos
 * from the job. Updates arrive over the request channel (progress.updated).
 */
function JobProgressPanel({ request }: { request: ServiceRequest }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const parts = request.job_parts ?? [];
  const updates = [...(request.job_updates ?? [])].reverse(); // newest first
  const partsTotal = parts.reduce((sum, p) => sum + (p.unit_price ?? 0) * p.quantity, 0);

  if (!parts.length && !updates.length) {
    return (
      <Card style={{ gap: 6, alignItems: 'center', paddingVertical: 22 }}>
        <Icon name="wrench" size={22} color={t.colors.ink3} />
        <Text variant="caption" center color={t.colors.ink2}>
          {tr('requestDetail.workEmpty')}
        </Text>
      </Card>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Row>
        <SectionLabel count={parts.length || undefined}>{tr('requestDetail.workLabel')}</SectionLabel>
        <View style={{ flex: 1 }} />
        {partsTotal > 0 && (
          <Text weight="800" style={{ fontSize: 13.5 }} color={t.colors.accent}>
            {brl(partsTotal)}
          </Text>
        )}
      </Row>

      {parts.length > 0 && (
        <Card padded={false} style={{ paddingHorizontal: 16 }}>
          {parts.map((p, i) => (
            <Row key={p.id} style={{ paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderColor: t.colors.line, gap: 10 }}>
              <Icon name="wrench" size={15} color={t.colors.ink3} />
              <Text weight="700" style={{ flex: 1, fontSize: 14 }} numberOfLines={1}>
                {p.quantity}× {p.name}
              </Text>
              {p.approved_at ? <Icon name="check" size={14} color={t.colors.ok} /> : null}
              <Text weight="700" style={{ fontSize: 13.5 }}>
                {p.unit_price != null ? brl(p.unit_price * p.quantity) : '—'}
              </Text>
            </Row>
          ))}
        </Card>
      )}

      {updates.map((u) => (
        <Card key={u.id} style={{ gap: 8 }}>
          <Row gap={10} style={{ alignItems: 'flex-start' }}>
            <Icon name="camera" size={15} color={t.colors.accent} />
            <View style={{ flex: 1 }}>
              {u.body ? <Text style={{ fontSize: 14 }}>{u.body}</Text> : null}
              {u.photo_url ? (
                <Image source={{ uri: u.photo_url }} style={{ width: '100%', height: 160, borderRadius: 12, marginTop: 8 }} />
              ) : null}
            </View>
          </Row>
        </Card>
      ))}
    </View>
  );
}

/** One `label · value` line inside the request-details card. */
function DetailRow({ label, value, first }: { label: string; value: string; first?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 10,
        borderTopWidth: first ? 0 : 1,
        borderColor: t.colors.line,
      }}
    >
      <Text variant="caption" weight="700" color={t.colors.ink3} style={{ width: 92 }}>
        {label}
      </Text>
      <Text weight="700" style={{ flex: 1, fontSize: 13.5 }}>
        {value}
      </Text>
    </View>
  );
}

/**
 * The agreed price, stated once and unmissably. It used to be a caption in the
 * event feed's header, which is the last place someone looks for "what am I
 * paying". When parts or surcharges have moved the total, both numbers show —
 * the approved figure is what was agreed, the total is what it is now.
 */
function ApprovedValueCard({ request }: { request: ServiceRequest }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const approved = request.accepted_proposal?.price;
  const total = request.settlement?.total;

  if (approved == null) return null;

  const moved = total != null && Math.abs(total - approved) >= 0.01;

  return (
    <Card style={{ gap: 4, alignItems: 'center', borderWidth: 1.5, borderColor: t.colors.ok }}>
      <Text variant="label" color={t.colors.ink2}>{tr('eventFeed.approvedValue')}</Text>
      {/* lineHeight is REQUIRED here. The `body` variant hardcodes lineHeight 21;
          overriding fontSize to 30 without it leaves a 30px glyph in a 21px line
          box, which clips anything reaching past the x-height — "R$ 240,00"
          rendered as "RS 240.00" on device, losing the $ bar and the comma tail. */}
      <Text weight="800" style={{ fontSize: 30, lineHeight: 38, color: t.colors.ok }}>{brl(approved)}</Text>
      {moved && (
        <Row gap={6}>
          <Icon name="flash" size={13} color={t.colors.ink3} />
          <Text variant="caption" color={t.colors.ink3}>
            {tr('requestDetail.currentTotal')} · {brl(total!)}
          </Text>
        </Row>
      )}
    </Card>
  );
}

// RequestAssetCard lived here; it's now the pinned JobSubject strip
// (src/components/JobSubject.tsx), which also carries the client's photos.

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
