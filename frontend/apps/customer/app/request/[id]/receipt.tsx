import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SkeletonScreen, BackBar, Screen, useTheme } from '@chamafacil/shared';
import { useRequest } from '../../../src/queries';
import { LoadErrorScreen } from '../../../src/components/LoadError';
import { ReceiptView } from '../../../src/components/ReceiptView';

/**
 * V3PagamentoOk (C20): the receipt, also rendered inline on the request detail.
 *
 * This route is an **intentional** alias, not a leftover: the payment notification
 * deep-links straight here, so the user lands on the receipt instead of having to
 * find it inside the request screen. Unlike `proposals`/`track`, it renders its
 * own content rather than redirecting — do not "clean it up".
 */
export default function ReceiptScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading, isError, refetch } = useRequest(requestId);

  // `isLoading || !request` collapsed two different states into one:
  // on a failed query isLoading is false and request is undefined, so this
  // screen sat on the skeleton forever, promising it was almost there.
  if (isLoading) return <SkeletonScreen />;
  if (isError || !request) return <LoadErrorScreen onRetry={refetch} />;

  return (
    <Screen stickyHeader padded={false}>
      <BackBar backLabel={tr('common.back')} title={tr('receipt.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/request/${requestId}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <ReceiptView request={request} header />
      </View>
    </Screen>
  );
}
