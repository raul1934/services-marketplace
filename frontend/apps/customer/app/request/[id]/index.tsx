import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  Asset,
  AvInit,
  BackBar,
  Badge,
  Button,
  Card,
  Icon,
  NotFoundView,
  QnaThread,
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
  isActiveStatus,
  subscribeToRequest,
  useTheme,
} from '@walvee/shared';
import { keys, useAnswerQuestion, useApproveParts, useQuestions, useRequest, useRequestEvents, useTracking } from '../../../src/queries';
import { PickedPhoto, pickPhotos } from '../../../src/photos';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { EventFeed } from '../../../src/components/EventFeed';
import { ProposalsList } from '../../../src/components/ProposalsList';
import { ReceiptView } from '../../../src/components/ReceiptView';
import { ReviewForm } from '../../../src/components/ReviewForm';

const AV_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#0ea5e9'];
const initialsOf = (name?: string) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

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
  // Live tracking + event feed (lifted from the former /track screen).
  const trackable = request ? isActiveStatus(request.status) : false;
  const tracking = useTracking(requestId, trackable);
  const { data: events } = useRequestEvents(requestId);
  const [live, setLive] = useState<{ lat: number; lng: number } | null>(null);
  // ProposalsList wires this; the screen's scroll fires it to page in more bids.
  const proposalsLoadMore = useRef<(() => void) | null>(null);

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
        title={tr('notFound.request.title')}
        body={tr('notFound.request.body')}
        homeLabel={tr('notFound.home')}
        onHome={() => router.replace('/(tabs)/requests')}
        backLabel={tr('common.back')}
        onBack={router.canGoBack() ? () => router.back() : undefined}
      />
    );
  }

  const active = isActiveStatus(request.status);
  const canReview = request.status === RequestStatus.Completed && !request.review;
  const isRequote = request.status === RequestStatus.Requote;
  const isCompleted = request.status === RequestStatus.Completed;
  const pendingSurcharge = request.surcharges?.find((s) => s.status === 'pending');
  const pendingReschedule = request.reschedule_requests?.find((r) => r.status === 'pending' && r.requested_by_role === 'provider');
  const statusText = tr(`enums.requestStatus.${request.status}`);

  // Live-tracking view model (only rendered while the job is active).
  const provLat = live?.lat ?? tracking.data?.latitude;
  const provLng = live?.lng ?? tracking.data?.longitude;
  const region: Region = { latitude: request.latitude, longitude: request.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };
  const trackStep = request.status === RequestStatus.InProgress ? 2 : request.status === RequestStatus.Completed ? 3 : 1;
  const trackSteps = [tr('tracking.stepAccepted'), tr('tracking.stepOnWay'), tr('tracking.stepArrived'), tr('tracking.stepDone')];

  return (
    <Screen stickyHeader padded={false} onEndReached={isOpen ? () => proposalsLoadMore.current?.() : undefined}>
      <BackBar
        title={request.category?.name ?? tr('requestDetail.fallbackTitle')}
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
                {request.category ? `${tr(`enums.categoryType.${request.category.type}`)} · ${request.category.name}` : tr('requestDetail.fallbackTitle')}
              </Text>
              {request.address && <Text variant="caption" numberOfLines={1}>{request.address}</Text>}
            </View>
            {request.urgency === RequestUrgency.Urgent && <Badge label={tr('enums.urgency.urgent')} tone="urgent" dot />}
          </Row>
        </Card>

        {request.asset && <RequestAssetCard asset={request.asset} onPress={() => router.push(`/assets/${request.asset!.id}`)} />}

        {(request.before_photos?.length || request.after_photos?.length) ? <JobPhotosView request={request} /> : null}

        {isOpen && <CustomerQna requestId={requestId} />}

        {isOpen && <ProposalsList requestId={requestId} budget={request.budget_max} loadMoreRef={proposalsLoadMore} />}

        {active && (
          <View style={{ gap: 14 }}>
            {/* Live map + ETA + progress strip (formerly the /track screen). */}
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <MapView style={{ height: 220 }} region={region}>
                <Marker coordinate={{ latitude: request.latitude, longitude: request.longitude }} pinColor={t.colors.accent} title={tr('requestDetail.fallbackTitle')} />
                {provLat != null && provLng != null && (
                  <Marker coordinate={{ latitude: provLat, longitude: provLng }} pinColor={t.colors.ok} title={request.provider?.name} />
                )}
              </MapView>
              <View style={{ padding: 16 }}>
                <Row>
                  <Icon name="navigate" size={22} color={t.colors.accent} />
                  <View style={{ flex: 1 }}>
                    <Text weight="800" style={{ fontSize: 17 }}>{tracking.data?.available ? distanceLabel(tracking.data.distance_km) : tr('tracking.subtitle')}</Text>
                    <Text variant="caption">{tracking.data?.available ? tr('tracking.arrivingIn', { eta: etaLabel(tracking.data.eta_minutes_approx) }) : tr('tracking.unavailable')}</Text>
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
                <Button title={tr('requestDetail.approve')} full loading={approve.isPending} onPress={() => approve.mutate()} />
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

        {/* Completed → receipt + consolidated summary + rating shown inline. */}
        {isCompleted && <ReceiptView request={request} />}
        {isCompleted && <CompletedSummary request={request} />}
        {canReview && <ReviewForm requestId={requestId} request={request} />}
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

/** Client reads and answers providers' pre-bid questions. */
function CustomerQna({ requestId }: { requestId: number }) {
  const { t: tr } = useTranslation();
  const { data: questions } = useQuestions(requestId);
  const answer = useAnswerQuestion(requestId);

  if (!questions?.length) return null;

  return (
    <View style={{ gap: 10 }}>
      <Row gap={8}>
        <SectionLabel count={questions.length}>{tr('requestDetail.qnaLabel')}</SectionLabel>
        <View style={{ flex: 1 }} />
        <Badge label={tr('requestDetail.preBid')} tone="open" dot />
      </Row>
      <Text variant="caption">{tr('requestDetail.qnaHelper')}</Text>
      <QnaThread
        questions={questions}
        onAnswer={(questionId, value, photo) => answer.mutate({ questionId, answer: value, photo: photo as PickedPhoto | undefined })}
        answering={answer.isPending}
        answerCta={tr('requestDetail.answerCta')}
        answerPlaceholder={tr('requestDetail.answerPlaceholder')}
        askedByLabel={(name) => tr('requestDetail.askedBy', { name: name ?? tr('requestDetail.fallbackProvider') })}
        pickPhoto={async () => {
          const [p] = await pickPhotos(1);
          return p ?? null;
        }}
        attachPhotoCta={tr('requestDetail.attachPhoto')}
        photoRequiredLabel={tr('requestDetail.photoRequired')}
      />
    </View>
  );
}
