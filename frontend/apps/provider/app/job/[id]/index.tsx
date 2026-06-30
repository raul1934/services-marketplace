import React, { useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  Text,
  brl,
  calcPayout,
  distanceLabel,
  isActiveStatus,
  relativeParts,
  PLATFORM_FEE_RATE,
  useAuth,
  useTheme,
} from '@walvee/shared';
import {
  useJob,
  useJobReport,
  useUpdateStatus,
} from '../../../src/queries';
import { CategoryIcon } from '../../../src/components/CategoryIcon';
import { RateClientForm } from '../../../src/components/RateClientForm';
import { StartCodeModal } from '../../../src/components/StartCodeModal';

const initialsOf = (name?: string) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function JobScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useJob(requestId);

  // Urgent jobs collect the client's code in a modal before starting.
  const [codeOpen, setCodeOpen] = useState(false);
  const updateStatus = useUpdateStatus(requestId);

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
        <SlideToConfirm label={tr('job.slideStart')} doneLabel={tr('job.slideStarted')} disabled={updateStatus.isPending} onConfirm={() => updateStatus.mutate(RequestStatus.InProgress)} />
      )
    ) : status === RequestStatus.InProgress ? (
      <SlideToConfirm label={tr('job.slideComplete')} doneLabel={tr('job.slideCompleted')} onConfirm={() => updateStatus.mutate(RequestStatus.Completed)} />
    ) : undefined;

  const hasCoords = request.latitude != null && request.longitude != null;

  const backBar = (
    <BackBar
      title={request.category?.name ?? tr('job.fallbackTitle')}
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
            {request.category ? `${tr(`enums.categoryType.${request.category.type}`)} · ${request.category.name}` : tr('job.fallbackTitle')}
          </Text>
          <Text variant="caption" numberOfLines={1}>{[request.address, request.client?.name].filter(Boolean).join(' · ')}</Text>
        </View>
        {request.urgency === RequestUrgency.Urgent && <Badge label={tr('enums.urgency.urgent')} tone="urgent" dot />}
      </Row>
      {!!request.description && <Text style={{ fontSize: 13, marginTop: 11, lineHeight: 18 }} color={t.colors.ink2}>"{request.description}"</Text>}
    </Card>
  );

  // `fill` makes the map grow to take the remaining vertical space (open job).
  const mapCard = (fill: boolean) =>
    hasCoords ? (
      <Card padded={false} style={[{ overflow: 'hidden' }, fill ? { flex: 1 } : null]}>
        <View style={fill ? { flex: 1 } : { height: 170 }} pointerEvents="none">
          <MapView
            style={{ flex: 1 }}
            initialRegion={{ latitude: request.latitude!, longitude: request.longitude!, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
          >
            <Marker coordinate={{ latitude: request.latitude!, longitude: request.longitude! }} pinColor={t.colors.accent} />
            {request.asset?.detail?.geofence && request.asset.detail.geofence.length >= 2 && (
              <Polygon coordinates={request.asset.detail.geofence} strokeColor={t.colors.accent} fillColor={`${t.colors.accent}33`} strokeWidth={2} />
            )}
          </MapView>
        </View>
        {!!request.address && (
          <Row style={{ gap: 8, padding: 12 }}>
            <Icon name="pin" size={16} color={t.colors.accent} />
            <Text variant="caption" weight="700" style={{ flex: 1 }} numberOfLines={2}>{request.address}</Text>
            {request.distance_km != null && <Text variant="caption" color={t.colors.ink3}>{distanceLabel(request.distance_km)}</Text>}
          </Row>
        )}
      </Card>
    ) : null;

  // Open job: map fills the screen, the bid CTA is pinned to the footer.
  if (isOpen) {
    return (
      <Screen
        padded={false}
        scroll={false}
        footer={request.my_proposal ? undefined : <Button title={tr('job.sendBidCta')} full onPress={() => router.push(`/job/${requestId}/bid`)} />}
      >
        {backBar}
        <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 14, gap: 14 }}>
          {summaryCard}
          {request.my_proposal && (
            <Row style={{ gap: 8, backgroundColor: t.colors.okSoft, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
              <Icon name="check" size={16} color={t.colors.ok} />
              <Text weight="700" color={t.colors.ok} style={{ flex: 1, fontSize: 13.5 }}>{tr('job.alreadyBidBody', { value: brl(request.my_proposal.price) })}</Text>
            </Row>
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
        {summaryCard}
        {mapCard(false)}
        {request.asset && <AssetCard asset={request.asset} />}
        <Management request={request} />
      </View>
      <StartCodeModal requestId={requestId} visible={codeOpen} onClose={() => setCodeOpen(false)} />
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

      {/* completed → rating / celebration (no slide) */}
      {status === RequestStatus.Completed && (
        request!.provider_review ? (
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
        ) : (
          // Rate the client inline — no separate screen for a completed job.
          <RateClientForm requestId={requestId} request={request} />
        )
      )}

      {/* In-job actions: surcharge / reschedule (R-ACRÉSCIMO / R-AGENDA) */}
      {(status === RequestStatus.Accepted || status === RequestStatus.InProgress) && (
        <Row gap={10}>
          <View style={{ flex: 1 }}>
            <Button title={tr('actions.surcharge.composeTitle')} variant="soft" full size="sm" onPress={() => router.push(`/job/${requestId}/surcharge`)} left={<Icon name="flash" size={15} color={t.colors.accent} />} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={tr('actions.reschedule.title')} variant="ghost" full size="sm" onPress={() => router.push(`/job/${requestId}/reschedule`)} left={<Icon name="calendar" size={15} color={t.colors.ink} />} />
          </View>
        </Row>
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
  const sub = [a.make, a.model, a.plate, a.color, a.kind, a.unit, a.species].filter(Boolean).join(' · ');
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
