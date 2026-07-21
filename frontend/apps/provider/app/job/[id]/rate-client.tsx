import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Screen } from '@chamafacil/shared';
import { useJob } from '../../../src/queries';
import { RateClientForm } from '../../../src/components/RateClientForm';

/** Rate-the-client route (P18). Also shown inline on the completed job screen. */
export default function RateClient() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request } = useJob(requestId);

  return (
    <Screen stickyHeader padded={false}>
      <BackBar backLabel={tr('common.back')} title={tr('rateClient.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/job/${id}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28 }}>
        <RateClientForm requestId={requestId} request={request} onSubmitted={() => (router.canGoBack() ? router.back() : router.replace(`/job/${id}`))} />
      </View>
    </Screen>
  );
}
