import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Card, Icon, Screen, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';
import { useJob, useReportCustomerNoShow } from '../../../src/queries';

/** Provider reports the client wasn't at the agreed location — cancels the job. */
export default function CustomerNoShowScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useJob(requestId);
  const report = useReportCustomerNoShow(requestId);

  if (isLoading || !request) {
    return (
      <Screen stickyHeader scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </Screen>
    );
  }

  const onReport = () =>
    report.mutate(undefined, {
      onSuccess: () => router.replace(`/job/${requestId}`),
      onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
    });

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('actions.customerNoShow.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/job/${id}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        <Card flat style={{ alignItems: 'center', gap: 8, paddingVertical: 22 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.colors.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="userX" size={30} color={t.colors.danger} />
          </View>
          <Text variant="h3" center>{tr('actions.customerNoShow.headline')}</Text>
          <Text variant="caption" center>{tr('actions.customerNoShow.body', { name: request.client?.name ?? tr('requestDetail.fallbackProvider') })}</Text>
        </Card>

        <SlideToConfirm
          label={tr('actions.customerNoShow.reportCta')}
          doneLabel={tr('actions.customerNoShow.reportDone')}
          disabled={report.isPending}
          variant="error"
          onConfirm={onReport}
        />
        <Text variant="caption" center>{tr('actions.customerNoShow.hint')}</Text>
      </View>
    </Screen>
  );
}
