import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Screen, useTheme } from '@chamafacil/shared';
import { useRequest } from '../../../src/queries';
import { ReceiptView } from '../../../src/components/ReceiptView';

/** V3PagamentoOk (C20): standalone receipt route. Also shown inline on the request detail. */
export default function ReceiptScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useRequest(requestId);

  if (isLoading || !request) {
    return (
      <Screen stickyHeader scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </Screen>
    );
  }

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('receipt.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/request/${requestId}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <ReceiptView request={request} header />
      </View>
    </Screen>
  );
}
