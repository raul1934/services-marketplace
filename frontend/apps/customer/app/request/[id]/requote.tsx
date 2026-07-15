import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SkeletonScreen, Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Button, Card, Icon, Row, Screen, SlideToConfirm, Text, brl, useTheme } from '@chamafacil/shared';
import { useRequest, useRequoteDecision } from '../../../src/queries';

/** RecotacaoScreen (C40): accept the present provider's new quote, or reopen to others. */
export default function RequoteScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useRequest(requestId);
  const decide = useRequoteDecision(requestId);

  if (isLoading || !request) return <SkeletonScreen />;

  const combinado = request.accepted_proposal?.price ?? 0;
  const pendingExtra = (request.surcharges ?? []).filter((s) => s.status === 'pending').reduce((s, x) => s + x.amount, 0);
  const approvedExtra = (request.surcharges ?? []).filter((s) => s.status === 'approved').reduce((s, x) => s + x.amount, 0);
  const newTotal = combinado + approvedExtra + pendingExtra;
  const reason = (request.surcharges ?? []).find((s) => s.status === 'pending')?.reason;

  const decideMut = (reopen: boolean) =>
    decide.mutate(
      { reopen },
      {
        onSuccess: () => {
          Alert.alert(tr('common.ok'), reopen ? tr('actions.requote.reopenedMsg') : tr('actions.requote.acceptedMsg'));
          router.replace(`/request/${requestId}`);
        },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );

  const footer = (
    <View style={{ gap: 8 }}>
      <SlideToConfirm
        label={tr('actions.requote.slideAccept', { value: brl(newTotal) })}
        doneLabel={tr('actions.requote.slideAccepted')}
        disabled={decide.isPending}
        onConfirm={() => decideMut(false)}
      />
      <Button title={tr('actions.requote.reopen')} variant="ghost" full onPress={() => decideMut(true)} left={<Icon name="search" size={16} color={t.colors.ink} />} />
    </View>
  );

  return (
    <Screen stickyHeader padded={false} footer={footer}>
      <BackBar title={tr('actions.requote.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/request/${id}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        <Card flat style={{ gap: 8 }}>
          <Row gap={10}>
            <Icon name="edit" size={20} color={t.colors.danger} />
            <Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.requote.headline')}</Text>
          </Row>
          <Text variant="caption">{tr('actions.requote.explain')}</Text>
        </Card>

        {!!reason && (
          <Card>
            <Text variant="label" color={t.colors.ink2}>{tr('actions.requote.providerReason')}</Text>
            <Text style={{ fontSize: 14, lineHeight: 19, marginTop: 4 }} color={t.colors.ink2}>"{reason}"</Text>
          </Card>
        )}

        <Card>
          <Row style={{ paddingVertical: 6 }}>
            <Text style={{ flex: 1 }} color={t.colors.ink2} weight="600">{tr('actions.requote.original')}</Text>
            <Text weight="600">{brl(combinado)}</Text>
          </Row>
          <Row style={{ paddingVertical: 6 }}>
            <Text style={{ flex: 1 }} color={t.colors.ink2} weight="600">{tr('actions.requote.newQuote')}</Text>
            <Text weight="800" style={{ fontSize: 17 }}>{brl(newTotal)}</Text>
          </Row>
        </Card>

        <Text variant="caption" center>{tr('actions.requote.reopenHint')}</Text>
      </View>
    </Screen>
  );
}
