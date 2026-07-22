import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { Alert } from '@chamafacil/shared';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AnswerList,
  Asset,
  AvInit,
  BackBar,
  Badge,
  BudgetMeter,
  Button,
  Card,
  Field,
  Icon,
  IconName,
  Price,
  QnaThread,
  Row,
  Screen,
  SectionLabel,
  Segment,
  SuccessSplash,
  Text,
  Toggle,
  Wiz,
  brl,
  calcPayout,
  distanceLabel,
  etaLabel,
  PLATFORM_FEE_RATE,
  RequestUrgency,
  useAuth,
  useTheme,
} from '@chamafacil/shared';
import { useAcceptCounterOffer, useAskQuestion, useDeclineCounterOffer, useJob, useQuestionSuggestions, useQuestions, useRemoveQuestion, useSubmitProposal, useWithdrawProposal } from '../../../src/queries';
import { CategoryIcon } from '../../../src/components/CategoryIcon';

const initialsOf = (name?: string) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const ETA_PRESETS = [10, 20, 30];
const TOTAL_STEPS = 4;

/** ProviderBidScreen (P09/P10/P11): the 4-step bid wizard for an open request. */
export default function BidScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr, i18n } = useTranslation();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useJob(requestId);

  const submit = useSubmitProposal(requestId);
  const withdraw = useWithdrawProposal(requestId);
  const acceptCounter = useAcceptCounterOffer(requestId);
  const declineCounter = useDeclineCounterOffer(requestId);
  // Center the price gauge on the area's average bid for this category, falling
  // back to the client's budget then a sane default.
  const avg = request?.area_avg_price ?? request?.budget_max ?? 120;
  // Commission comes from the provider's plan (backend); fall back to the default.
  const feeRate = user?.provider_profile?.commission_rate ?? PLATFORM_FEE_RATE;
  const feePctNum = feeRate * 100;
  const feePct = (Number.isInteger(feePctNum) ? String(feePctNum) : feePctNum.toFixed(1)).replace('.', i18n.language.startsWith('pt') ? ',' : '.');

  const [step, setStep] = useState(1);
  const [price, setPrice] = useState(avg);
  const [eta, setEta] = useState(ETA_PRESETS[0]);
  const [comment, setComment] = useState('');
  const [deposit, setDeposit] = useState(false);
  const [sent, setSent] = useState(false);
  const DEPOSIT_PCT = 20;
  const depositAmount = Math.round((price * DEPOSIT_PCT) / 100);

  if (isLoading || !request) {
    return (
      <Screen stickyHeader scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </Screen>
    );
  }

  const categoryName = request.category ? tr(`categories.${request.category.slug}`, { defaultValue: request.category.name }) : undefined;

  // already bid → simple confirmation screen. A withdrawn or declined
  // proposal doesn't count as "already bid" — it should fall through to the
  // wizard below so the provider can send a fresh one.
  const activeProposal = request.my_proposal && !['withdrawn', 'declined'].includes(request.my_proposal.status) ? request.my_proposal : null;
  if (activeProposal) {
    return (
      <Screen stickyHeader padded={false}>
        <BackBar backLabel={tr('common.back')} title={categoryName ?? tr('job.fallbackTitle')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))} />
        <View style={{ paddingHorizontal: 20, paddingTop: 40, alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={44} color={t.colors.ok} />
          <Text variant="h3">{tr('job.alreadyBidTitle')}</Text>
          <Text variant="caption" center>{tr('job.alreadyBidBody', { value: brl(activeProposal.price) })}</Text>
          {activeProposal.pending_counter_offer && (
            <Card style={{ width: '100%', marginTop: 14, gap: 10 }}>
              <Text weight="800" style={{ fontSize: 14.5 }}>
                {tr('job.counterReceived', { value: brl(activeProposal.pending_counter_offer.price) })}
              </Text>
              {activeProposal.pending_counter_offer.message && (
                <Text variant="caption" color={t.colors.ink2}>"{activeProposal.pending_counter_offer.message}"</Text>
              )}
              <Row style={{ gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title={tr('job.counterDecline')}
                    variant="ghost"
                    full
                    size="sm"
                    loading={declineCounter.isPending}
                    onPress={() => declineCounter.mutate(activeProposal.pending_counter_offer!.id)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={tr('job.counterAccept')}
                    variant="grad"
                    full
                    size="sm"
                    loading={acceptCounter.isPending}
                    onPress={() => acceptCounter.mutate(activeProposal.pending_counter_offer!.id)}
                  />
                </View>
              </Row>
            </Card>
          )}
          <Button title={tr('common.back')} variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }} />
          <Text
            weight="700"
            color={t.colors.danger}
            style={{ fontSize: 13, marginTop: 14 }}
            onPress={() =>
              Alert.alert(tr('job.withdrawConfirmTitle'), tr('job.withdrawConfirmBody'), [
                { text: tr('common.back'), style: 'cancel' },
                {
                  text: tr('job.withdrawCta'),
                  style: 'destructive',
                  onPress: () => withdraw.mutate(activeProposal.id, { onSuccess: () => router.back() }),
                },
              ])
            }
          >
            {tr('job.withdrawCta')}
          </Text>
        </View>
      </Screen>
    );
  }

  const payout = calcPayout(price, feeRate);
  const send = () => {
    submit.mutate(
      {
        price,
        eta_minutes: eta,
        comment: comment.trim() || undefined,
        deposit_required: deposit,
        deposit_percentage: deposit ? DEPOSIT_PCT : undefined,
      },
      {
        // Show the success splash; navigation happens on its onDone. Setting
        // `sent` also locks the slide so the bid can't be submitted twice.
        onSuccess: () => setSent(true),
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );
  };

  // Title/subtitle per step (1: review · 2: questions · 3: price · 4: summary).
  const COPY: Record<number, [string, string]> = {
    1: [tr('bid.reviewTitle'), tr('bid.reviewSub')],
    2: [tr('bid.questionsTitle'), tr('bid.questionsSub')],
    3: [tr('bid.priceTitle'), tr('bid.priceSub')],
    4: [tr('bid.summaryTitle'), tr('bid.summarySub')],
  };
  const [title, sub] = COPY[step];

  const footer =
    step < TOTAL_STEPS
      ? {
          primary: { label: tr('common.continue'), onPress: () => setStep(step + 1) },
          ...(step > 1 ? { back: () => setStep(step - 1) } : {}),
        }
      : { slide: { label: tr('job.slideSendBid'), doneLabel: tr('job.bidSentTitle'), onConfirm: send, disabled: submit.isPending || sent, confirmHint: tr('common.slideHint') }, back: () => setStep(step - 1) };

  return (
    <View style={{ flex: 1 }}>
    <Wiz
      backLabel={tr('common.back')}
      stepLabel={tr('common.wizStep', { step: step, total: TOTAL_STEPS })}
      cat={categoryName ?? tr('job.fallbackTitle')}
      step={step}
      total={TOTAL_STEPS}
      title={title}
      sub={sub}
      onBack={() => (step === 1 ? router.back() : setStep(step - 1))}
      footer={footer}
    >
      {step === 1 && (
        <>
          {/* job review */}
          <Card>
            <Row>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <CategoryIcon category={request.category} size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="800" style={{ fontSize: 15.5 }} numberOfLines={1}>{categoryName}</Text>
                <Text variant="caption" numberOfLines={1}>{[request.address, distanceLabel(request.distance_km)].filter(Boolean).join(' · ')}</Text>
              </View>
              {request.urgency === RequestUrgency.Urgent && <Badge label={tr('enums.urgency.urgent')} tone="urgent" dot />}
            </Row>
            {!!request.description && <Text style={{ fontSize: 13, marginTop: 11, lineHeight: 18 }} color={t.colors.ink2}>"{request.description}"</Text>}
            {request.client?.name && (
              <Row style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: t.colors.line, gap: 9 }}>
                <AvInit initials={initialsOf(request.client.name)} color="#7c8aa0" size={34} />
                <Text weight="700" style={{ fontSize: 13.5 }}>{request.client.name}</Text>
              </Row>
            )}
          </Card>

          {/* where the job is */}
          {request.latitude != null && request.longitude != null && (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <View style={{ height: 170 }} pointerEvents="none">
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{ latitude: request.latitude, longitude: request.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
                >
                  <Marker coordinate={{ latitude: request.latitude, longitude: request.longitude }} pinColor={t.colors.accent} />
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
          )}

          {request.asset && <AssetCard asset={request.asset} />}

          {/* client's intake answers (e.g. vehicle) — payment moved to the final step */}
          {request.answers?.length ? (
            <Card>
              <SectionLabel>{tr('bid.requestInfoLabel')}</SectionLabel>
              <AnswerList answers={request.answers} />
            </Card>
          ) : null}
        </>
      )}

      {step === 2 && <ProviderQna requestId={requestId} />}

      {step === 3 && (
        <>
          <BudgetMeter
            value={price}
            onChange={setPrice}
            min={60}
            max={Math.max(260, Math.round(avg * 2))}
            step={5}
            bandLo={Math.round(avg * 0.75)}
            bandHi={Math.round(avg * 1.3)}
            regionAvg={avg}
            mode="bid"
            label={tr('job.priceLabel')}
            currency={tr('common.currency')}
            pill={tr('job.areaAverage')}
            pillIcon="location"
            renderInfo={({ word, value }) => (
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: t.colors.ink2, lineHeight: 18 }}>
                {tr('job.bidInfo', { avg, value, chance: tr(`job.chance.${word}`) })}
              </Text>
            )}
            decreaseLabel={tr('common.decrease')}
            increaseLabel={tr('common.increase')}
          />

          <SectionLabel>{tr('bid.arrivalTime')}</SectionLabel>
          <Segment items={ETA_PRESETS.map((m) => ({ value: String(m), label: `${m} min` }))} value={String(eta)} onChange={(v) => setEta(Number(v))} />
          {request.urgency === RequestUrgency.Urgent && request.max_wait_minutes != null && eta > request.max_wait_minutes && (
            <Row style={{ gap: 8, backgroundColor: t.colors.dangerSoft, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12 }}>
              <Icon name="clock" size={14} color={t.colors.danger} />
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '700' }} color={t.colors.danger}>
                {tr('bid.etaExceedsWait', { max: request.max_wait_minutes })}
              </Text>
            </Row>
          )}
        </>
      )}

      {step === 4 && (
        <>
          <Card>
            <SumRow icon="briefcase" k={tr('bid.sumJob')} v={categoryName ?? '—'} />
            <SumRow icon="dollar" k={tr('job.priceLabel')} v={brl(price)} />
            <SumRow icon="clock" k={tr('bid.arrivalTime')} v={`~${etaLabel(eta)}`} />
            {request.distance_km != null && <SumRow icon="pin" k={tr('bid.distance')} v={distanceLabel(request.distance_km)} />}
            {request.payment_method && <SumRow icon={request.payment_method} k={tr('bid.paymentLabel')} v={tr(`enums.paymentMethod.${request.payment_method}`)} />}
          </Card>
          {/* payout */}
          <Card>
            <Row style={{ paddingVertical: 7 }}>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600' }} color={t.colors.ink2}>{tr('job.priceLabel')}</Text>
              <Text style={{ fontSize: 14 }}>{brl(price)}</Text>
            </Row>
            <Row style={{ paddingVertical: 7 }}>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600' }} color={t.colors.ink2}>{tr('job.fee', { pct: feePct })}</Text>
              <Text style={{ fontSize: 14 }} color={t.colors.ink2}>− {brl(payout.fee)}</Text>
            </Row>
            <View style={{ height: 1, backgroundColor: t.colors.line, marginVertical: 6 }} />
            <Row>
              <Text weight="800" style={{ flex: 1 }}>{tr('job.payout')}</Text>
              <Price value={payout.net.toFixed(2).replace('.', ',')} size={19} />
            </Row>
          </Card>
          <Field label={tr('job.messageLabel')} value={comment} onChangeText={setComment} placeholder={tr('job.messagePlaceholder')} multiline voiceInput style={{ height: 64, textAlignVertical: 'top' }} />

          {/* optional deposit to reduce no-shows */}
          <Pressable
            onPress={() => setDeposit((d) => !d)}
            accessible
            accessibilityRole="switch"
            accessibilityState={{ checked: deposit }}
            accessibilityLabel={tr('bid.depositTitle', { percent: DEPOSIT_PCT })}
          >
            <Card flat>
              <Row style={{ gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="shield" size={20} color={t.colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="800" style={{ fontSize: 14 }}>{tr('bid.depositTitle', { percent: DEPOSIT_PCT })}</Text>
                  <Text variant="caption">{tr('bid.depositSub', { value: brl(depositAmount) })}</Text>
                </View>
                <Toggle on={deposit} />
              </Row>
            </Card>
          </Pressable>
        </>
      )}
    </Wiz>
    {sent && <SuccessSplash onDone={() => router.replace(`/job/${requestId}`)} />}
    </View>
  );
}

const MAX_QUESTIONS = 3;

/** Provider asks the client pre-bid questions: pick a suggestion or type a custom one. */
function ProviderQna({ requestId }: { requestId: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { user } = useAuth();
  const { data: questions } = useQuestions(requestId);
  const { data: suggestions } = useQuestionSuggestions(requestId);
  const ask = useAskQuestion(requestId);
  const remove = useRemoveQuestion(requestId);
  const [text, setText] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<'your' | 'others'>('your');

  const all = questions ?? [];
  const mine = all.filter((q) => q.provider_id === user?.id);
  const others = all.filter((q) => q.provider_id !== user?.id);
  const atMax = mine.length >= MAX_QUESTIONS;

  const asked = new Set(all.map((q) => q.question));
  const fresh = (suggestions ?? []).filter((s) => !asked.has(s.text));

  const submitCustom = () => {
    if (!text.trim() || atMax) return;
    ask.mutate({ question: text.trim() }, { onSuccess: () => { setText(''); setSheetOpen(false); } });
  };

  const closeSheet = () => { setText(''); setSheetOpen(false); };

  // Immediate delete on ×: react-native-web's Alert can't render a confirm
  // dialog, so we avoid it and just remove (the × is a deliberate, small tap).
  const removeQuestion = (questionId: number) => remove.mutate(questionId);

  return (
    <View style={{ gap: 12 }}>
      <Segment
        value={tab}
        onChange={setTab}
        items={[
          { value: 'your', label: tr('bid.yourQuestions') },
          { value: 'others', label: tr('bid.otherProsQuestions', { count: others.length }) },
        ]}
      />

      {tab === 'your' ? (
        <>
          {mine.length ? (
            <QnaThread
              questions={mine}
              askedByLabel={() => tr('bid.youAsked')}
              onRemove={removeQuestion}
              canRemove={(q) => q.provider_id === user?.id}
              photoRequiredLegend={tr('bid.photoRequiredLegend')}
            />
          ) : null}

          {atMax ? (
            <Text variant="caption" color={t.colors.ink3}>{tr('bid.maxQuestions', { max: MAX_QUESTIONS })}</Text>
          ) : (
            <>
              {fresh.length ? (
                <>
                  <SectionLabel>{tr('bid.suggestionsLabel')}</SectionLabel>
                  <View style={{ gap: 8 }}>
                    {fresh.map((s) => (
                      <Pressable
                        key={s.id}
                        disabled={ask.isPending}
                        onPress={() => ask.mutate({ suggestion_id: s.id })}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: t.colors.line, backgroundColor: t.colors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text weight="600" style={{ fontSize: 14 }}>{s.text}</Text>
                          {s.image_required && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                              <Icon name="camera" size={13} color={t.colors.accent} />
                              <Text variant="caption" color={t.colors.accent}>{tr('bid.photoRequiredLegend')}</Text>
                            </View>
                          )}
                        </View>
                        <Icon name="plus" size={18} color={t.colors.accent} />
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}

              <Button title={tr('bid.askCta')} size="sm" variant="soft" onPress={() => setSheetOpen(true)} left={<Icon name="chat" size={16} color={t.colors.accent} />} />
            </>
          )}
        </>
      ) : others.length ? (
        <QnaThread
          questions={others}
          askedByLabel={() => tr('bid.askedByOther')}
          photoRequiredLegend={tr('bid.photoRequiredLegend')}
        />
      ) : (
        <Text variant="caption" color={t.colors.ink3}>{tr('bid.noOtherQuestions')}</Text>
      )}

      <QuestionSheet
        visible={sheetOpen}
        onClose={closeSheet}
        value={text}
        onChangeText={setText}
        onSend={submitCustom}
        loading={ask.isPending}
        title={tr('bid.askTitle')}
        placeholder={tr('bid.askPlaceholder')}
        sendCta={tr('bid.askCta')}
      />
    </View>
  );
}

/** Bottom sheet to compose a custom pre-bid question. */
function QuestionSheet({
  visible,
  onClose,
  value,
  onChangeText,
  onSend,
  loading,
  title,
  placeholder,
  sendCta,
}: {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  loading?: boolean;
  title: string;
  placeholder: string;
  sendCta: string;
}) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} />
        <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, gap: 14 }}>
          <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line }} />
          <Text variant="h3">{title}</Text>
          <Field
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            autoFocus
            multiline
            voiceInput
            style={{ height: 96, textAlignVertical: 'top' }}
          />
          <Button title={sendCta} full loading={loading} disabled={!value.trim()} onPress={onSend} left={<Icon name="chat" size={18} color="#fff" />} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
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

function SumRow({ icon, k, v }: { icon: IconName; k: string; v: string }) {
  const t = useTheme();
  return (
    <Row style={{ gap: 12, paddingVertical: 11 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={t.colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="caption" weight="700">{k}</Text>
        <Text weight="700" style={{ fontSize: 14.5, marginTop: 1 }} numberOfLines={1}>{v}</Text>
      </View>
    </Row>
  );
}
