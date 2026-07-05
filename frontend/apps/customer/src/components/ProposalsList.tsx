import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { Alert } from '@walvee/shared';
import { useTranslation } from 'react-i18next';
import {
  AvInit,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  PreBidQuestion,
  Price,
  Proposal,
  QnaThread,
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
import { useAcceptProposal, useAnswerQuestion, useCancelRequest, useCounterProposal, useDeclineProposal, useProposals, useQuestions } from '../queries';
import { PickedPhoto, pickPhotos } from '../photos';

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
  maxWaitMinutes,
  loadMoreRef,
}: {
  requestId: number;
  budget?: number | null;
  /** Urgent requests only — highlights proposals whose ETA fits within it. */
  maxWaitMinutes?: number | null;
  /** The parent screen's scroll wires this to load the next page of proposals. */
  loadMoreRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [sort, setSort] = useState<ProposalSort>('price');
  const proposals = useProposals(requestId, sort);
  const accept = useAcceptProposal(requestId);
  const decline = useDeclineProposal(requestId);
  const counter = useCounterProposal(requestId);
  const cancel = useCancelRequest(requestId);
  const items = flattenPages(proposals.data?.pages);
  const [counterTarget, setCounterTarget] = useState<Proposal | null>(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  // Pre-bid Q&A now lives inside each bid: the backend only returns questions
  // from providers who published a proposal, so we group them by provider.
  const questions = useQuestions(requestId);
  const answer = useAnswerQuestion(requestId);
  const questionsByProvider = useMemo(() => {
    const m = new Map<number, PreBidQuestion[]>();
    for (const q of questions.data ?? []) {
      const arr = m.get(q.provider_id) ?? [];
      arr.push(q);
      m.set(q.provider_id, arr);
    }
    return m;
  }, [questions.data]);

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

  const onDecline = (p: Proposal) =>
    Alert.alert(tr('requestDetail.declineConfirmTitle'), tr('requestDetail.declineConfirmBody'), [
      { text: tr('common.back'), style: 'cancel' },
      {
        text: tr('requestDetail.declineBid'),
        style: 'destructive',
        onPress: () => decline.mutate(p.id, { onError: (e) => Alert.alert(tr('common.error'), (e as Error).message) }),
      },
    ]);

  const openCounter = (p: Proposal) => {
    setCounterTarget(p);
    setCounterPrice(String(Math.round(p.price)));
    setCounterMessage('');
  };

  const sendCounter = () => {
    const price = Number(counterPrice.replace(',', '.'));
    if (!counterTarget || !price || price <= 0) return;
    counter.mutate(
      { proposalId: counterTarget.id, price, message: counterMessage.trim() || undefined },
      {
        onSuccess: () => setCounterTarget(null),
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );
  };

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
          <ProposalCard
            key={p.id}
            proposal={p}
            index={i}
            best={i === 0}
            budget={budget}
            withinWait={maxWaitMinutes != null && p.eta_minutes <= maxWaitMinutes}
            pending={accept.isPending}
            onAccept={() => onAccept(p)}
            onDecline={() => onDecline(p)}
            declining={decline.isPending}
            onCounter={() => openCounter(p)}
            questions={questionsByProvider.get(p.provider_id) ?? []}
            answering={answer.isPending}
            onAnswer={(questionId, value, photo) => answer.mutate({ questionId, answer: value, photo: photo as PickedPhoto | undefined })}
          />
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

      <CounterOfferSheet
        visible={!!counterTarget}
        onClose={() => setCounterTarget(null)}
        price={counterPrice}
        onChangePrice={setCounterPrice}
        message={counterMessage}
        onChangeMessage={setCounterMessage}
        onSend={sendCounter}
        loading={counter.isPending}
      />
    </View>
  );
}

function CounterOfferSheet({
  visible,
  onClose,
  price,
  onChangePrice,
  message,
  onChangeMessage,
  onSend,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  price: string;
  onChangePrice: (v: string) => void;
  message: string;
  onChangeMessage: (v: string) => void;
  onSend: () => void;
  loading?: boolean;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} />
        <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, gap: 14 }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line }} />
          <Text variant="h3">{tr('requestDetail.counterTitle')}</Text>
          <Field
            label={tr('requestDetail.counterPriceLabel')}
            value={price}
            onChangeText={onChangePrice}
            keyboardType="numeric"
            placeholder="0"
            autoFocus
          />
          <Field
            label={tr('requestDetail.counterMessageLabel')}
            value={message}
            onChangeText={onChangeMessage}
            placeholder={tr('requestDetail.counterMessagePlaceholder')}
            multiline
            style={{ height: 72, textAlignVertical: 'top' }}
          />
          <Button title={tr('requestDetail.counterSendCta')} full loading={loading} disabled={!price.trim()} onPress={onSend} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
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

function ProposalCard({
  proposal,
  index,
  best,
  budget,
  withinWait,
  onAccept,
  pending,
  onDecline,
  declining,
  onCounter,
  questions,
  answering,
  onAnswer,
}: {
  proposal: Proposal;
  index: number;
  best?: boolean;
  budget?: number | null;
  withinWait?: boolean;
  onAccept: () => void;
  pending: boolean;
  onDecline: () => void;
  declining: boolean;
  onCounter: () => void;
  questions: PreBidQuestion[];
  answering: boolean;
  onAnswer: (questionId: number, answer: string, photo?: { uri: string; fileName?: string; mimeType?: string }) => void;
}) {
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
            <Icon name="clock" size={12} color={withinWait ? t.colors.ok : t.colors.ink2} />
            <Text variant="caption" weight="700" color={withinWait ? t.colors.ok : undefined}>{etaLabel(proposal.eta_minutes)}</Text>
          </Row>
          {withinWait && <Text variant="caption" weight="800" color={t.colors.ok} style={{ marginTop: 2 }}>{tr('requestDetail.withinWait')}</Text>}
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
      {proposal.pending_counter_offer && (
        <Row gap={7} style={{ marginTop: 10, backgroundColor: t.colors.surface2, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 11 }}>
          <Icon name="clock" size={15} color={t.colors.ink2} />
          <Text variant="caption" weight="700" color={t.colors.ink2}>
            {tr('requestDetail.counterPending', { value: brl(proposal.pending_counter_offer.price) })}
          </Text>
        </Row>
      )}
      {questions.length > 0 && (
        <View style={{ marginTop: 12, gap: 8 }}>
          <SectionLabel count={questions.length}>{tr('requestDetail.bidQnaLabel')}</SectionLabel>
          <QnaThread
            questions={questions}
            onAnswer={onAnswer}
            answering={answering}
            answerCta={tr('requestDetail.answerCta')}
            answerPlaceholder={tr('requestDetail.answerPlaceholder')}
            pickPhoto={async () => {
              const [p] = await pickPhotos(1);
              return p ?? null;
            }}
            attachPhotoCta={tr('requestDetail.attachPhoto')}
            photoRequiredLabel={tr('requestDetail.photoRequired')}
            photoRequiredLegend={tr('requestDetail.photoRequired')}
          />
        </View>
      )}
      <View style={{ marginTop: 12, gap: 8 }}>
        {best ? (
          <SlideToConfirm compact label={tr('requestDetail.slideAccept')} doneLabel={tr('requestDetail.slideAccepted')} disabled={pending} onConfirm={onAccept} />
        ) : (
          <Button title={tr('requestDetail.acceptBid')} variant="grad" size="sm" full onPress={onAccept} />
        )}
        <Row style={{ justifyContent: 'center', gap: 16 }}>
          <Text center weight="700" color={t.colors.ink3} style={{ fontSize: 12.5, opacity: declining ? 0.5 : 1 }} onPress={declining ? undefined : onDecline}>
            {tr('requestDetail.declineBid')}
          </Text>
          {!proposal.pending_counter_offer && (
            <Text center weight="700" color={t.colors.accent} style={{ fontSize: 12.5 }} onPress={onCounter}>
              {tr('requestDetail.counterCta')}
            </Text>
          )}
        </Row>
      </View>
    </Card>
  );
}
