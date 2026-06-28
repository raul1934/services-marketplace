import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Screen } from '@walvee/shared';
import { useRequest } from '../../../src/queries';
import { ReviewForm } from '../../../src/components/ReviewForm';

/** Rate-the-provider route (C21). Also shown inline on the completed request detail. */
export default function Rate() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request } = useRequest(requestId);

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('rate.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/request/${id}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <ReviewForm requestId={requestId} request={request} onSubmitted={() => (router.canGoBack() ? router.back() : router.replace(`/request/${id}`))} />
      </View>
    </Screen>
  );
}
