import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  AvInit,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  Price,
  Proposal,
  Row,
  SectionLabel,
  SlideToConfirm,
  Stars,
  Text,
  brl,
  etaLabel,
  flattenPages,
  useTheme,
} from '@walvee/shared';
import { ProposalSort } from '../api';
import { useAcceptProposal, useCancelRequest, useProposals } from '../queries';

const AV_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#0ea5e9'];
const initialsOf = (name?: string) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/**
 * EscolheProposta (C12/C14): compare incoming proposals and accept one — rendered
 * inline on the open request screen (no separate route). Accepting refreshes the
 * request/feed and the screen morphs into the accepted state; cancelling re-renders
 * into the cancelled state. No navigation either way.
 */
export function ProposalsList({
  requestId,
  budget,
  loadMoreRef,
}: {
  requestId: number;
  budget?: number | null;
  /** The parent screen's scroll wires this to load the next page of proposals. */
  loadMoreRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [sort, setSort] = useState<ProposalSort>('price');
  const proposals = useProposals(requestId, sort);
  const accept = useAcceptProposal(requestId);
  const cancel = useCancelRequest(requestId);
  const items = flattenPages(proposals.data?.pages);

  // Expose "load more" to the host screen, which fires it on scroll-to-bottom.
  useEffect(() => {
    if (!loadMoreRef) return;
    loadMoreRef.current = () => {
      if (proposals.hasNextPage && !proposals.isFetchingNextPage) proposals.fetchNextPage();
    };
    return () => {
      loadMoreRef.current = null;
    };
  }, [loadMoreRef, proposals.hasNextPage, proposals.isFetchingNextPage, proposals.fetchNextPage]);

  const onAccept = (p: Proposal) =>
    accept.mutate(p.id, { onError: (e) => Alert.alert(tr('common.error'), (e as Error).message) });

  return (
    <View style={{ gap: 14 }}>
      <Row>
        <SectionLabel count={items.length}>{tr('requestDetail.proposalsLabel')}</SectionLabel>
        <View style={{ flex: 1 }} />
        <View style={{ width: 178 }}>
          <SortSeg value={sort} onChange={setSort} />
        </View>
      </Row>

      {proposals.isLoading ? (
        <ActivityIndicator color={t.colors.accent} style={{ marginTop: 20 }} />
      ) : !items.length ? (
        <EmptyState fill icon="clock" title={tr('requestDetail.waitingTitle')} body={tr('requestDetail.waitingBody')} />
      ) : (
        items.map((p, i) => (
          <ProposalCard key={p.id} proposal={p} index={i} best={i === 0} budget={budget} pending={accept.isPending} onAccept={() => onAccept(p)} />
        ))
      )}

      {proposals.isFetchingNextPage && <ActivityIndicator color={t.colors.accent} style={{ marginVertical: 8 }} />}

      <Text
        center
        weight="700"
        color={t.colors.ink3}
        style={{ fontSize: 13, paddingVertical: 6 }}
        onPress={() =>
          Alert.alert(tr('requestDetail.cancelConfirmTitle'), tr('requestDetail.cancelConfirmBody'), [
            { text: tr('common.back'), style: 'cancel' },
            { text: tr('requestDetail.cancelRequest'), style: 'destructive', onPress: () => cancel.mutate(undefined) },
          ])
        }
      >
        {tr('requestDetail.cancelRequest')}
      </Text>
    </View>
  );
}

function SortSeg({ value, onChange }: { value: ProposalSort; onChange: (s: ProposalSort) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const opts: { v: ProposalSort; label: string }[] = [
    { v: 'price', label: tr('requestDetail.sort.price') },
    { v: 'eta', label: tr('requestDetail.sort.eta') },
    { v: 'rating', label: tr('requestDetail.sort.rating') },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 3, backgroundColor: t.colors.surface2, borderRadius: t.radius.field, borderWidth: 1, borderColor: t.colors.line, padding: 3 }}>
      {opts.map((o) => {
        const on = value === o.v;
        return (
          <Text
            key={o.v}
            onPress={() => onChange(o.v)}
            weight="700"
            color={on ? t.colors.ink : t.colors.ink2}
            center
            style={[{ flex: 1, fontSize: 12, paddingVertical: 6, borderRadius: t.radius.field - 4, overflow: 'hidden', backgroundColor: on ? t.colors.surface : 'transparent' }]}
          >
            {o.label}
          </Text>
        );
      })}
    </View>
  );
}

function ProposalCard({ proposal, index, best, budget, onAccept, pending }: { proposal: Proposal; index: number; best?: boolean; budget?: number | null; onAccept: () => void; pending: boolean }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const delta = budget != null ? proposal.price - budget : null;
  const deltaLabel =
    delta == null || Math.abs(delta) < 0.5
      ? budget != null ? tr('requestDetail.deltaOn') : null
      : tr(delta > 0 ? 'requestDetail.deltaAbove' : 'requestDetail.deltaBelow', { value: brl(Math.abs(delta)) });
  const deltaColor = delta == null || Math.abs(delta) < 0.5 ? t.colors.ink3 : delta > 0 ? t.colors.danger : t.colors.ok;
  return (
    <Card style={{ borderWidth: best ? 1.5 : 0, borderColor: best ? t.colors.accent : undefined, marginTop: best ? 10 : 0 }}>
      {best && (
        <View style={{ position: 'absolute', top: -10, right: 16 }}>
          <Badge label={tr('requestDetail.bestMatch')} tone="open" />
        </View>
      )}
      <Row style={{ alignItems: 'flex-start' }}>
        <AvInit initials={initialsOf(proposal.provider_name)} color={AV_COLORS[index % AV_COLORS.length]} />
        <View style={{ flex: 1 }}>
          <Text weight="800" style={{ fontSize: 15.5 }}>{proposal.provider_name ?? tr('requestDetail.fallbackProvider')}</Text>
          <Row gap={6} style={{ marginTop: 2 }}>
            <Stars value={proposal.provider_rating_avg ?? 0} size={13} />
            <Text variant="caption" weight="600">{(proposal.provider_rating_avg ?? 0).toFixed(1)} · {proposal.provider_rating_count ?? 0} {tr('requestDetail.jobs')}</Text>
          </Row>
          {proposal.provider_insured && (
            <Row gap={4} style={{ marginTop: 4 }}>
              <Icon name="shieldCheck" size={12} color={t.colors.ok} />
              <Text variant="caption" weight="800" color={t.colors.ok}>{tr('requestDetail.insured')}</Text>
            </Row>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Price value={proposal.price} />
          <Row gap={3}>
            <Icon name="clock" size={12} color={t.colors.ink2} />
            <Text variant="caption" weight="700">{etaLabel(proposal.eta_minutes)}</Text>
          </Row>
          {deltaLabel && <Text variant="caption" weight="700" color={deltaColor} style={{ marginTop: 3 }}>{deltaLabel}</Text>}
        </View>
      </Row>
      {proposal.comment && (
        <Text style={{ fontSize: 13, marginTop: 10, lineHeight: 18 }} color={t.colors.ink2}>"{proposal.comment}"</Text>
      )}
      {proposal.deposit_required && (
        <Row gap={7} style={{ marginTop: 10, backgroundColor: t.colors.accentSoft, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 11 }}>
          <Icon name="shield" size={15} color={t.colors.accent} />
          <Text variant="caption" weight="700" color={t.colors.accent}>
            {tr('requestDetail.deposit', { percent: proposal.deposit_percentage ?? 0, value: brl(proposal.deposit_amount ?? 0) })}
          </Text>
        </Row>
      )}
      <View style={{ marginTop: 12 }}>
        {best ? (
          <SlideToConfirm compact label={tr('requestDetail.slideAccept')} doneLabel={tr('requestDetail.slideAccepted')} disabled={pending} onConfirm={onAccept} />
        ) : (
          <Button title={tr('requestDetail.acceptBid')} variant="grad" size="sm" full onPress={onAccept} />
        )}
      </View>
    </Card>
  );
}
