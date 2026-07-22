import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline } from 'react-native-maps';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
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
  SlideToConfirm,
  Stars,
  TestBanner, // TEMP — test bots. Remove with backend app/Bots.
  Text,
  brl,
  calcPayout,
  distanceLabel,
  etaLabel,
  etaMinutes,
  haversineKm,
  isActiveStatus,
  useRoute,
  relativeParts,
  PLATFORM_FEE_RATE,
  useAuth,
  useTheme,
} from '@chamafacil/shared';
import {
  useJob,
  useJobReport,
  useLiveLocation,
  useUpdateStatus,
} from '../../../src/queries';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { RateClientForm } from '../../../src/components/RateClientForm';
import { StartCodeModal } from '../../../src/components/StartCodeModal';

const initialsOf = (name?: string) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// Jobs the provider explicitly dismissed the rate-client modal for — resets on
// app reload (intentionally not persisted), just enough to stop nagging every
// time this screen regains focus in the same session.
const dismissedRatePrompts = new Set<number>();

export default function JobScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const requestId = Number(id);
  const { data: request, isLoading } = useJob(requestId);

  // Urgent jobs collect the client's code in a modal before starting.
  const [codeOpen, setCodeOpen] = useState(false);
  const updateStatus = useUpdateStatus(requestId);

  // Completed + unrated → rate-client prompt (re-opens on focus, closeable).
  const [rateOpen, setRateOpen] = useState(false);
  const canRate = request?.status === RequestStatus.Completed && !request?.provider_review;
  useFocusEffect(useCallback(() => {
    if (canRate && !dismissedRatePrompts.has(requestId)) setRateOpen(true);
  }, [canRate, requestId]));

  const dismissRate = () => {
    dismissedRatePrompts.add(requestId);
    setRateOpen(false);
  };

  // While the pro is en route / on the job, share live location so both the
  // client's tracking map and this screen's map show the pro alongside the job.
  const myPos = useLiveLocation(request ? isActiveStatus(request.status) : false);
  // Road route (OSRM) from the pro's live position to the job, drawn on the map.
  const route = useRoute(
    myPos,
    request?.latitude != null && request?.longitude != null ? { latitude: request.latitude, longitude: request.longitude } : null,
  );

  if (isLoading) {
    return (
      <Screen stickyHeader scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </Screen>
    );
  }
  if (!request) {
    return (
      <NotFoundView
        showBackBar
        icon="wrench"
        title={tr('notFound.job.title')}
        body={tr('notFound.job.body')}
        homeLabel={tr('notFound.home')}
        onHome={() => router.replace('/(tabs)/dashboard')}
        backLabel={tr('common.back')}
        onBack={router.canGoBack() ? () => router.back() : undefined}
      />
    );
  }

  const categoryName = request.category ? tr(`categories.${request.category.slug}`, { defaultValue: request.category.name }) : undefined;
  const status = request.status;
  const isOpen = status === RequestStatus.Open;
  const isMine = isActiveStatus(status) || status === RequestStatus.Completed;
  const statusText = tr(`enums.requestStatus.${status}`);
  // Urgent jobs require the client's 4-digit start code; scheduled jobs don't.
  const isUrgent = request.urgency === RequestUrgency.Urgent;

  // Start/complete actions are pinned to the footer. Urgent jobs open the 4-cell
  // code modal; scheduled jobs slide straight to start (no code).
  const footer =
    status === RequestStatus.Accepted ? (
      isUrgent ? (
        <Button title={tr('job.startUrgentCta')} full onPress={() => setCodeOpen(true)} />
      ) : (
        <SlideToConfirm label={tr('job.slideStart')} doneLabel={tr('job.slideStarted')} disabled={updateStatus.isPending} onConfirm={() => updateStatus.mutate(RequestStatus.InProgress)} confirmHint={tr('common.slideHint')} />
      )
    ) : status === RequestStatus.InProgress ? (
      <SlideToConfirm label={tr('job.slideComplete')} doneLabel={tr('job.slideCompleted')} onConfirm={() => updateStatus.mutate(RequestStatus.Completed)} confirmHint={tr('common.slideHint')} />
    ) : canRate ? (
      <Button title={tr('rateClient.promptCta')} full onPress={() => setRateOpen(true)} />
    ) : undefined;

  const hasCoords = request.latitude != null && request.longitude != null;

  const backBar = (
    <BackBar
      backLabel={tr('common.back')}
      title={categoryName ?? tr('job.fallbackTitle')}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))}
      right={<Badge label={statusText} tone={isOpen ? 'open' : 'live'} dot={isOpen || isActiveStatus(status)} />}
    />
  );

  const summaryCard = (
    <Card>
      <Row>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <CategoryIcon category={request.category} size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="800" style={{ fontSize: 15.5 }} numberOfLines={1}>
            {request.category ? `${tr(`enums.categoryType.${request.category.type}`)} · ${categoryName}` : tr('job.fallbackTitle')}
          </Text>
          <Text variant="caption" numberOfLines={1}>{[request.address, request.client?.name].filter(Boolean).join(' · ')}</Text>
        </View>
        {request.urgency === RequestUrgency.Urgent && <Badge label={tr('enums.urgency.urgent')} tone="urgent" dot />}
      </Row>
      {!!request.description && <Text style={{ fontSize: 13, marginTop: 11, lineHeight: 18 }} color={t.colors.ink2}>"{request.description}"</Text>}
    </Card>
  );

  // `fill` makes the map grow to take the remaining vertical space (open job).
  const mapCard = (fill: boolean) => {
    if (!hasCoords) return null;
    const job = { latitude: request.latitude!, longitude: request.longitude! };
    // En route → frame both the job and the pro; otherwise center on the job.
    const region = myPos
      ? {
          latitude: (job.latitude + myPos.latitude) / 2,
          longitude: (job.longitude + myPos.longitude) / 2,
          latitudeDelta: Math.max(0.02, Math.abs(job.latitude - myPos.latitude) * 2.4),
          longitudeDelta: Math.max(0.02, Math.abs(job.longitude - myPos.longitude) * 2.4),
        }
      : { ...job, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    const proKm = route?.distanceKm ?? (myPos ? haversineKm(job.latitude, job.longitude, myPos.latitude, myPos.longitude) : null);
    const proEta = route?.durationMin ?? (proKm != null ? etaMinutes(proKm) : null);
    return (
      <Card padded={false} style={[{ overflow: 'hidden' }, fill ? { flex: 1 } : null]}>
        <View style={fill ? { flex: 1 } : { height: 170 }} pointerEvents="none">
          <MapView style={{ flex: 1 }} region={region}>
            {route && <Polyline coordinates={route.coords} strokeColor={t.colors.accent} strokeWidth={5} />}
            <Marker coordinate={job} pinColor={t.colors.accent} title={tr('job.jobMarker')} />
            {myPos && <Marker coordinate={myPos} pinColor={t.colors.ok} title={tr('job.youMarker')} />}
            {request.asset?.detail?.geofence && request.asset.detail.geofence.length >= 2 && (
              <Polygon coordinates={request.asset.detail.geofence} strokeColor={t.colors.accent} fillColor={`${t.colors.accent}33`} strokeWidth={2} />
            )}
          </MapView>
        </View>
        {proKm != null ? (
          // En route → distance + ETA + Live, mirroring the client's tracking card.
          <View style={{ padding: 16 }}>
            <Row>
              <Icon name="navigate" size={22} color={t.colors.accent} />
              <View style={{ flex: 1 }}>
                <Text weight="800" style={{ fontSize: 17 }}>{distanceLabel(proKm)}</Text>
                <Text variant="caption">{tr('job.arrivingIn', { eta: etaLabel(proEta) })}</Text>
              </View>
              <Badge label={tr('job.live')} tone="live" dot />
            </Row>
          </View>
        ) : !!request.address ? (
          <Row style={{ gap: 8, padding: 12 }}>
            <Icon name="pin" size={16} color={t.colors.accent} />
            <Text variant="caption" weight="700" style={{ flex: 1 }} numberOfLines={2}>{request.address}</Text>
            {request.distance_km != null && <Text variant="caption" color={t.colors.ink3}>{distanceLabel(request.distance_km)}</Text>}
          </Row>
        ) : null}
      </Card>
    );
  };

  // Open job: map fills the screen, the bid CTA is pinned to the footer.
  // A withdrawn or declined proposal doesn't block a fresh bid — only an
  // active one (still pending, or somehow accepted while the request shows
  // open) should hide the "Send Proposal" CTA.
  const activeProposal = request.my_proposal && !['withdrawn', 'declined'].includes(request.my_proposal.status) ? request.my_proposal : null;
  if (isOpen) {
    return (
      <Screen
        padded={false}
        scroll={false}
        footer={activeProposal ? undefined : <Button title={tr('job.sendBidCta')} full onPress={() => router.push(`/job/${requestId}/bid`)} />}
      >
        {backBar}
        <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 14, gap: 14 }}>
          {summaryCard}
          {activeProposal && (
            <Pressable onPress={() => router.push(`/job/${requestId}/bid`)}>
              <Row style={{ gap: 8, backgroundColor: t.colors.okSoft, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
                <Icon name="check" size={16} color={t.colors.ok} />
                <Text weight="700" color={t.colors.ok} style={{ flex: 1, fontSize: 13.5 }}>{tr('job.alreadyBidBody', { value: brl(activeProposal.price) })}</Text>
                <Icon name="arrowR" size={14} color={t.colors.ok} />
              </Row>
            </Pressable>
          )}
          {request.asset && <AssetCard asset={request.asset} />}
          {mapCard(true)}
        </View>
      </Screen>
    );
  }

  return (
    <Screen stickyHeader padded={false} footer={footer}>
      {backBar}
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        {/* TEMP — test bots. Remove with backend app/Bots. */}
        {request.is_test && <TestBanner message="Chamado de teste gerado por bot." />}
        {summaryCard}
        {mapCard(false)}
        {request.asset && <AssetCard asset={request.asset} />}
        <Management request={request} />
      </View>
      <StartCodeModal
        requestId={requestId}
        visible={codeOpen}
        onClose={() => setCodeOpen(false)}
        testStartCode={request.test_start_code} // TEMP — test bots.
      />

      {/* Rate-client prompt: opens on top when completed+unrated, re-prompts on
          focus until dismissed once, closeable. */}
      <Modal visible={rateOpen} transparent animationType="slide" onRequestClose={dismissRate}>
        <Pressable onPress={dismissRate} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12, maxHeight: '92%' }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line, marginBottom: 6 }} />
            {/* Same fix as the customer app's rating sheet: a fixed padding put
                the submit button under Android's navigation bar. */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 + insets.bottom }}>
              <Row style={{ marginBottom: 8 }}>
                <Text weight="800" style={{ flex: 1, fontSize: 17 }}>{tr('rateClient.title')}</Text>
                <Pressable onPress={dismissRate} hitSlop={8}><Icon name="close" size={22} color={t.colors.ink3} /></Pressable>
              </Row>
              <RateClientForm requestId={requestId} request={request} onSubmitted={() => setRateOpen(false)} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

/**
 * Job control (Screen A) body: the at-a-glance state + secondary actions + the
 * worklog entry. The primary start/complete slide is rendered by JobScreen in
 * the sticky footer; here we only surface the optional start-code field.
 */
function Management({ request }: { request: ReturnType<typeof useJob>['data'] }) {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { user } = useAuth();
  const requestId = request!.id;
  const status = request!.status;
  const { parts } = useJobReport(requestId);

  // Payout glance for the worklog card (the full breakdown lives on Screen B).
  const labor = request!.accepted_proposal?.price ?? 0;
  const partsTotal = (parts.data ?? []).reduce((s, p) => s + (p.unit_price ?? 0) * p.quantity, 0);
  const feeRate = user?.provider_profile?.commission_rate ?? PLATFORM_FEE_RATE;
  const net = labor + partsTotal - calcPayout(labor + partsTotal, feeRate).fee;
  const elapsed = request!.started_at ? relativeParts(request!.started_at) : null;
  const incomingReschedule = (request!.reschedule_requests ?? []).find((r) => r.status === 'pending' && r.requested_by_role === 'client');

  return (
    <View style={{ gap: 14 }}>
      {/* job stats */}
      <Card>
        <Row>
          <AvInit initials={initialsOf(request!.client?.name)} color="#3b82f6" size={40} />
          <View style={{ flex: 1 }}>
            <Text weight="800" style={{ fontSize: 15 }}>{request!.client?.name}</Text>
            <Text variant="caption">{request!.address}</Text>
          </View>
        </Row>
        <Row style={{ marginTop: 13, paddingTop: 13, borderTopWidth: 1, borderColor: t.colors.line, gap: 0, alignItems: 'stretch' }}>
          <JobStat v={timeOf(request!.started_at)} k={tr('job.started')} />
          <View style={{ width: 1, backgroundColor: t.colors.line }} />
          <JobStat v={elapsed ? `${elapsed.count} ${elapsed.unit === 'hour' ? 'h' : 'min'}` : '—'} k={tr('job.elapsed')} pad />
          <View style={{ width: 1, backgroundColor: t.colors.line }} />
          <JobStat v={tr(`enums.requestStatus.${status}`)} k={tr('job.status')} pad color={t.colors.ok} />
        </Row>
      </Card>

      {/* Urgent start-code is collected in StartCodeModal (opened from the footer). */}

      {/* completed → show the submitted rating (the rate-client form is prompted on top, see JobScreen). */}
      {status === RequestStatus.Completed && request!.provider_review && (
        <Card style={{ gap: 10 }}>
          <Row>
            <Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('job.yourRating')}</Text>
            <Stars value={request!.provider_review.rating} size={16} />
          </Row>
          {!!request!.provider_review.tags?.length && (
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              {request!.provider_review.tags.map((tg) => <Badge key={tg} label={tg} tone="neutral" />)}
            </Row>
          )}
          {!!request!.provider_review.comment && (
            <Text style={{ fontSize: 13.5, lineHeight: 18 }} color={t.colors.ink2}>"{request!.provider_review.comment}"</Text>
          )}
        </Card>
      )}

      {/* In-job actions: surcharge / reschedule (R-ACRÉSCIMO / R-AGENDA) */}
      {(status === RequestStatus.Accepted || status === RequestStatus.InProgress) && (
        <>
          <Row gap={10}>
            <View style={{ flex: 1 }}>
              <Button title={tr('actions.surcharge.composeTitle')} variant="soft" full size="sm" onPress={() => router.push(`/job/${requestId}/surcharge`)} left={<Icon name="flash" size={15} color={t.colors.accent} />} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title={tr('actions.reschedule.title')} variant="ghost" full size="sm" onPress={() => router.push(`/job/${requestId}/reschedule`)} left={<Icon name="calendar" size={15} color={t.colors.ink} />} />
            </View>
          </Row>
          <Text center weight="700" color={t.colors.ink3} style={{ fontSize: 12.5 }} onPress={() => router.push(`/job/${requestId}/customer-no-show`)}>
            {tr('actions.customerNoShow.title')}
          </Text>
        </>
      )}
      {incomingReschedule && (
        <Button title={tr('actions.reschedule.incomingTitleClient')} variant="soft" full onPress={() => router.push(`/job/${requestId}/reschedule`)} left={<Icon name="calendar" size={16} color={t.colors.accent} />} />
      )}
      {status === RequestStatus.Completed && (
        <Button title={tr('actions.dispute.defenseTitle')} variant="ghost" full onPress={() => router.push(`/job/${requestId}/dispute`)} left={<Icon name="shield" size={16} color={t.colors.ink} />} />
      )}

      {/* worklog entry — photos, parts & earnings live on Screen B */}
      <Card onPress={() => router.push(`/job/${requestId}/worklog`)}>
        <Row gap={12}>
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="briefcase" size={20} color={t.colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="800" style={{ fontSize: 14.5 }}>{tr('job.worklogTitle')}</Text>
            <Text variant="caption">{tr('job.worklogSub')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="caption" weight="700" color={t.colors.ink3}>{tr('job.payout')}</Text>
            <Text weight="800" style={{ fontSize: 14.5 }} color={t.colors.accent}>{brl(net)}</Text>
          </View>
          <Icon name="fwd" size={18} color={t.colors.ink3} />
        </Row>
      </Card>
    </View>
  );
}

function JobStat({ v, k, pad, color }: { v: string; k: string; pad?: boolean; color?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, paddingLeft: pad ? 14 : 0 }}>
      <Text weight="800" style={{ fontSize: 16 }} color={color}>{v}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.colors.ink3, letterSpacing: 0.5, marginTop: 2 }}>{k.toUpperCase()}</Text>
    </View>
  );
}

function timeOf(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** The asset (vehicle/property/pet) the request is tied to — shown to the pro. */
function AssetCard({ asset }: { asset: Asset }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const a = asset.detail ?? {};
  // `kind` is the raw API token ('car' / 'motorcycle'); translated here so a
  // Portuguese screen does not read "Aprilia · motorcycle".
  const kind = a.kind ? tr(`assets.vehicleKind.${a.kind}`) : null;
  const sub = [a.make, a.model, a.plate, a.color, kind, a.unit, a.species].filter(Boolean).join(' · ');
  const icon = asset.type === 'property' ? 'home' : asset.type === 'pet' ? 'paw' : 'car';
  return (
    <Card>
      <Row gap={12}>
        <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          {a.make_logo_url ? (
            <Image source={{ uri: a.make_logo_url }} style={{ width: 34, height: 34 }} resizeMode="contain" />
          ) : (
            <Icon name={icon} size={22} color={t.colors.accent} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="caption" weight="700" color={t.colors.ink3}>{tr('job.assetLabel')}</Text>
          <Text weight="800" style={{ fontSize: 14.5 }}>{asset.nickname}</Text>
          {!!sub && <Text variant="caption" numberOfLines={1}>{sub}</Text>}
        </View>
      </Row>
    </Card>
  );
}
