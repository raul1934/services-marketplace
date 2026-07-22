import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SkeletonScreen, Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BackBar, Button, Card, Field, Icon, RescheduleRequest, Row, Screen, SectionLabel, Segment, Text, useTheme,
} from '@chamafacil/shared';
import { useRequest, useRequestReschedule, useResolveReschedule } from '../../../src/queries';
import { LoadErrorScreen } from '../../../src/components/LoadError';
import { DatePicker } from '../../../src/components/DatePicker';

const PERIODS: Record<string, [number, number]> = {
  morning: [8, 12], afternoon: [13, 17], evening: [18, 22], dawn: [0, 5],
};

/** RescheduleFlow (C43): client proposes a new slot, or answers the provider's request. */
export default function RescheduleScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading, isError, refetch } = useRequest(requestId);
  const propose = useRequestReschedule(requestId);
  const resolve = useResolveReschedule(requestId);

  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('morning');
  const [reason, setReason] = useState('');

  // `isLoading || !request` collapsed two different states into one:
  // on a failed query isLoading is false and request is undefined, so this
  // screen sat on the skeleton forever, promising it was almost there.
  if (isLoading) return <SkeletonScreen />;
  if (isError || !request) return <LoadErrorScreen onRetry={refetch} />;

  // A reschedule from the provider awaiting this client's decision.
  const incoming = (request.reschedule_requests ?? []).find((r) => r.status === 'pending' && r.requested_by_role === 'provider');

  const submit = () => {
    // The picker only ever emits YYYY-MM-DD, so this is now "nothing picked
    // yet" rather than "you typed the date wrong" - which is the whole point of
    // the change: the shape of the value stopped being the customer's problem.
    if (!date) {
      Alert.alert(tr('common.error'), tr('actions.reschedule.dateError'));
      return;
    }
    const [h0, h1] = PERIODS[period];
    propose.mutate(
      {
        proposed_starts_at: `${date}T${String(h0).padStart(2, '0')}:00:00`,
        proposed_ends_at: `${date}T${String(h1).padStart(2, '0')}:00:00`,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: () => { Alert.alert(tr('common.ok'), tr('actions.reschedule.sent')); router.back(); },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );
  };

  const answer = (accept: boolean) =>
    resolve.mutate(
      { rescheduleId: incoming!.id, accept },
      {
        onSuccess: () => {
          Alert.alert(tr('common.ok'), tr(accept ? 'actions.reschedule.acceptedMsg' : 'actions.reschedule.declinedMsg'));
          router.back();
        },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );

  return (
    // The send button used to scroll away with the form, unlike every other
    // exception screen — surcharge and requote both pin theirs. On a small
    // phone with the keyboard up it could be entirely off-screen.
    <Screen
      stickyHeader
      padded={false}
      footer={
        incoming ? undefined : (
          <Button title={tr('actions.reschedule.send')} full loading={propose.isPending} onPress={submit} />
        )
      }
    >
      <BackBar backLabel={tr('common.back')} title={tr('actions.reschedule.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/request/${id}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        {incoming ? (
          <IncomingCard reschedule={incoming} busy={resolve.isPending} onAccept={() => answer(true)} onDecline={() => answer(false)} />
        ) : (
          <>
            <Card flat style={{ gap: 6 }}>
              <Row gap={10}><Icon name="calendar" size={20} color={t.colors.accent} /><Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.reschedule.proposeTitle')}</Text></Row>
              <Text variant="caption">{tr('actions.reschedule.proposeHint')}</Text>
            </Card>
            <DatePicker
              label={tr('actions.reschedule.dateLabel')}
              value={date}
              onChange={setDate}
              placeholder={tr('actions.reschedule.datePlaceholder')}
              disablePast
            />
            <SectionLabel>{tr('actions.reschedule.periodLabel')}</SectionLabel>
            <Segment
              items={Object.keys(PERIODS).map((p) => ({ value: p, label: tr(`actions.reschedule.period.${p}`) }))}
              value={period}
              onChange={setPeriod}
            />
            <Field label={tr('actions.reschedule.reasonLabel')} value={reason} onChangeText={setReason} placeholder={tr('actions.reschedule.reasonPlaceholder')} multiline voiceInput style={{ height: 64, textAlignVertical: 'top' }} />
          </>
        )}
      </View>
    </Screen>
  );
}

function IncomingCard({ reschedule, busy, onAccept, onDecline }: { reschedule: RescheduleRequest; busy: boolean; onAccept: () => void; onDecline: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const when = reschedule.proposed_starts_at ? new Date(reschedule.proposed_starts_at).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  return (
    <>
      <Card style={{ gap: 8 }}>
        <Row gap={10}><Icon name="calendar" size={20} color={t.colors.accent} /><Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.reschedule.incomingTitle')}</Text></Row>
        <Text style={{ fontSize: 15 }} weight="700">{when}</Text>
        {!!reschedule.reason && <Text variant="caption">"{reschedule.reason}"</Text>}
        {reschedule.late && (
          <Row gap={6} style={{ backgroundColor: t.colors.dangerSoft, borderRadius: 10, padding: 9 }}>
            <Icon name="clock" size={14} color={t.colors.danger} />
            <Text weight="700" color={t.colors.danger} style={{ fontSize: 12 }}>{tr('actions.reschedule.lateWarning')}</Text>
          </Row>
        )}
      </Card>
      <Button title={tr('actions.reschedule.accept')} full loading={busy} onPress={onAccept} />
      <Button title={tr('actions.reschedule.decline')} variant="ghost" full onPress={onDecline} />
      <Text variant="caption" center>{tr('actions.reschedule.declineHint')}</Text>
    </>
  );
}
