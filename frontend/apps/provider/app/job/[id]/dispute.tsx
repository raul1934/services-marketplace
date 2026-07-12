import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BackBar, Badge, Button, Card, Dispute, EmptyState, Field, Icon, Row, Screen, SectionLabel, Text, useTheme,
} from '@chamafacil/shared';
import { useDispute, useFileDisputeDefense } from '../../../src/queries';
import { appendPhoto, pickPhotos, PickedPhoto } from '../../../src/photos';

/** ProviderDisputeDefense (P19): provider reads the claim and files their defense (R5). */
export default function ProviderDisputeScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: dispute, isLoading } = useDispute(requestId) as { data?: Dispute | null; isLoading: boolean };
  const file = useFileDisputeDefense(requestId);

  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  if (isLoading) {
    return (
      <Screen stickyHeader scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </Screen>
    );
  }

  if (!dispute) {
    return (
      <Screen stickyHeader padded={false}>
        <BackBar title={tr('actions.dispute.defenseTitle')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/job/${requestId}`))} />
        <EmptyState fill icon="shield" title={tr('actions.dispute.none')} body={tr('actions.dispute.noneBody')} />
      </Screen>
    );
  }

  const resolved = dispute.status === 'resolved';
  const myDefense = dispute.evidence?.some((e) => e.party === 'provider');

  const addPhotos = async () => {
    try {
      const picked = await pickPhotos(5 - photos.length);
      if (picked.length) setPhotos((cur) => [...cur, ...picked].slice(0, 5));
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  const submit = async () => {
    const form = new FormData();
    if (text.trim()) form.append('text', text.trim());
    for (const p of photos) await appendPhoto(form, 'photos[]', p);
    file.mutate(
      { disputeId: dispute.id, form },
      {
        onSuccess: () => { Alert.alert(tr('common.ok'), tr('actions.dispute.defenseSent')); router.back(); },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );
  };

  return (
    <Screen stickyHeader padded={false}>
      <BackBar
        title={tr('actions.dispute.defenseTitle')}
        onBack={() => (router.canGoBack() ? router.back() : router.replace(`/job/${requestId}`))}
        right={<Badge label={tr(`actions.dispute.status.${dispute.status}`)} tone={resolved ? 'live' : 'urgent'} dot />}
      />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        {/* Client's claim */}
        <Card style={{ gap: 8 }}>
          <Row gap={10}><Icon name="shield" size={20} color={t.colors.danger} /><Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.dispute.claimFromClient')}</Text></Row>
          <Text style={{ fontSize: 14, lineHeight: 19 }} color={t.colors.ink2}>"{dispute.claim}"</Text>
          {dispute.evidence?.filter((e) => e.party === 'client' && e.photos?.length).map((e, i) => (
            <View key={i} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {e.photos!.map((url, j) => <Image key={j} source={{ uri: url }} style={{ width: 64, height: 64, borderRadius: 10 }} />)}
            </View>
          ))}
        </Card>

        {myDefense || resolved ? (
          <Card flat style={{ alignItems: 'center', gap: 6, paddingVertical: 22 }}>
            <Icon name="check" size={28} color={t.colors.ok} />
            <Text variant="h3" center>{resolved ? tr('actions.dispute.resolvedTitle') : tr('actions.dispute.defenseFiled')}</Text>
            <Text variant="caption" center>{tr('actions.dispute.retentionNoticePro')}</Text>
          </Card>
        ) : (
          <>
            <Field
              label={tr('actions.dispute.myVersionLabel')}
              value={text}
              onChangeText={setText}
              placeholder={tr('actions.dispute.myVersionPlaceholder')}
              multiline
              voiceInput
              style={{ height: 110, textAlignVertical: 'top' }}
            />
            <SectionLabel>{tr('actions.dispute.evidenceLabel')}</SectionLabel>
            <Text variant="caption">{tr('actions.dispute.evidenceProHint')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {photos.map((p, i) => <Image key={i} source={{ uri: p.uri }} style={{ width: 72, height: 72, borderRadius: 12 }} />)}
              {photos.length < 5 && (
                <Pressable onPress={addPhotos} style={{ width: 72, height: 72, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.line, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="camera" size={20} color={t.colors.accent} />
                </Pressable>
              )}
            </View>
            <Button title={tr('actions.dispute.sendDefense')} full loading={file.isPending} onPress={submit} />
            <Text variant="caption" center>{tr('actions.dispute.retentionNoticePro')}</Text>
          </>
        )}
      </View>
    </Screen>
  );
}
