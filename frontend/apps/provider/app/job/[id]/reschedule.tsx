import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BackBar, Button, Card, Field, Icon, RescheduleRequest, Row, Screen, SectionLabel, Segment, Text, useTheme,
} from '@chamafacil/shared';
import { useJob, useRequestReschedule, useResolveReschedule } from '../../../src/queries';

const PERIODS: Record<string, [number, number]> = {
  morning: [8, 12], afternoon: [13, 17], evening: [18, 22], dawn: [0, 5],
};

/** RescheduleFlow (P25): provider proposes a new slot, or answers the client's request. */
export default function ProviderRescheduleScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useJob(requestId);
  const propose = useRequestReschedule(requestId);
  const resolve = useResolveReschedule(requestId);

  const [date, setDate] = useState('');
  const [period, setPeriod] = useState('morning');
  const [reason, setReason] = useState('');

  if (isLoading || !request) {
    return (
      <Screen stickyHeader scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </Screen>
    );
  }

  const incoming = (request.reschedule_requests ?? []).find((r) => r.status === 'pending' && r.requested_by_role === 'client');

  const submit = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Alert.alert(tr('common.error'), tr('actions.reschedule.dateError'));
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
      { onSuccess: () => router.back(), onError: (e) => Alert.alert(tr('common.error'), (e as Error).message) },
    );

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('actions.reschedule.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/job/${requestId}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        {incoming ? (
          <IncomingCard reschedule={incoming} busy={resolve.isPending} onAccept={() => answer(true)} onDecline={() => answer(false)} />
        ) : (
          <>
            <Card flat style={{ gap: 6 }}>
              <Row gap={10}><Icon name="calendar" size={20} color={t.colors.accent} /><Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.reschedule.proposeTitle')}</Text></Row>
              <Text variant="caption">{tr('actions.reschedule.proInfo')}</Text>
            </Card>
            <Field label={tr('actions.reschedule.dateLabel')} value={date} onChangeText={setDate} placeholder="2026-06-25" autoCapitalize="none" />
            <SectionLabel>{tr('actions.reschedule.periodLabel')}</SectionLabel>
            <Segment items={Object.keys(PERIODS).map((p) => ({ value: p, label: tr(`actions.reschedule.period.${p}`) }))} value={period} onChange={setPeriod} />
            <Field label={tr('actions.reschedule.reasonLabel')} value={reason} onChangeText={setReason} placeholder={tr('actions.reschedule.reasonPlaceholder')} multiline voiceInput style={{ height: 64, textAlignVertical: 'top' }} />
            <Button title={tr('actions.reschedule.send')} full loading={propose.isPending} onPress={submit} />
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
        <Row gap={10}><Icon name="calendar" size={20} color={t.colors.accent} /><Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.reschedule.incomingTitleClient')}</Text></Row>
        <Text style={{ fontSize: 15 }} weight="700">{when}</Text>
        {!!reschedule.reason && <Text variant="caption">"{reschedule.reason}"</Text>}
      </Card>
      <Button title={tr('actions.reschedule.accept')} full loading={busy} onPress={onAccept} />
      <Button title={tr('actions.reschedule.declinePro')} variant="ghost" full onPress={onDecline} />
      <Text variant="caption" center>{tr('actions.reschedule.declineProHint')}</Text>
    </>
  );
}
