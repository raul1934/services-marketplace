import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SkeletonScreen, Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Button, Card, Icon, IconName, Row, Screen, Text, useTheme } from '@chamafacil/shared';
import { useRequest, useReportNoShow, useCancelRequest } from '../../../src/queries';

/** V3NoShow (C35): provider didn't show — wait, reopen at no cost, or cancel. */
export default function NoShowScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useRequest(requestId);
  const reopen = useReportNoShow(requestId);
  const cancel = useCancelRequest(requestId);

  if (isLoading || !request) return <SkeletonScreen />;

  const onReopen = () =>
    reopen.mutate(undefined, {
      onSuccess: () => { Alert.alert(tr('common.ok'), tr('actions.noShow.reopenedMsg')); router.replace(`/request/${requestId}`); },
      onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
    });

  const onCancel = () =>
    cancel.mutate(undefined, {
      onSuccess: () => { Alert.alert(tr('common.ok'), tr('actions.noShow.cancelledMsg')); router.replace('/(tabs)/requests'); },
      onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
    });

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('actions.noShow.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/request/${id}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        <Card flat style={{ alignItems: 'center', gap: 8, paddingVertical: 22 }}>
          <Text style={{ fontSize: 40 }}>🕒</Text>
          <Text variant="h3" center>{tr('actions.noShow.headline')}</Text>
          <Text variant="caption" center>{tr('actions.noShow.body', { name: request.provider?.name ?? tr('requestDetail.fallbackProvider') })}</Text>
        </Card>

        <Option icon="clock" title={tr('actions.noShow.waitTitle')} sub={tr('actions.noShow.waitSub')} onPress={() => router.back()} />
        <Button title={tr('actions.noShow.reopen')} full loading={reopen.isPending} onPress={onReopen} left={<Icon name="search" size={16} color={t.colors.accentInk} />} />
        <Button title={tr('actions.noShow.cancel')} variant="danger" full loading={cancel.isPending} onPress={onCancel} />
        <Text variant="caption" center>{tr('actions.noShow.refundHint')}</Text>
      </View>
    </Screen>
  );
}

function Option({ icon, title, sub, onPress }: { icon: IconName; title: string; sub: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Card onPress={onPress}>
      <Row gap={12}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={20} color={t.colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="800" style={{ fontSize: 14.5 }}>{title}</Text>
          <Text variant="caption">{sub}</Text>
        </View>
        <Icon name="arrowR" size={18} color={t.colors.ink3} />
      </Row>
    </Card>
  );
}
