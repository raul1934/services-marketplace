import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Alert } from '@walvee/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BackBar, Badge, Button, Card, Dispute, Field, Icon, Row, Screen, SectionLabel, Text, useTheme,
} from '@walvee/shared';
import { useDispute, useOpenDispute } from '../../../src/queries';
import { appendPhoto, pickPhotos, PickedPhoto } from '../../../src/photos';

/** V3Disputa + V3DisputaStatus (C37/C38): open a dispute or view its mediation status. */
export default function DisputeScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: dispute, isLoading } = useDispute(requestId) as { data?: Dispute | null; isLoading: boolean };
  const open = useOpenDispute(requestId);

  const [claim, setClaim] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  if (isLoading) {
    return (
      <Screen stickyHeader scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </Screen>
    );
  }

  const addPhotos = async () => {
    try {
      const picked = await pickPhotos(5 - photos.length);
      if (picked.length) setPhotos((cur) => [...cur, ...picked].slice(0, 5));
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  const submit = async () => {
    if (claim.trim().length < 10) {
      Alert.alert(tr('common.error'), tr('actions.dispute.claimError'));
      return;
    }
    const form = new FormData();
    form.append('claim', claim.trim());
    for (const p of photos) await appendPhoto(form, 'photos[]', p);
    open.mutate(form, {
      onSuccess: () => { Alert.alert(tr('common.ok'), tr('actions.dispute.openedMsg')); router.back(); },
      onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
    });
  };

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('actions.dispute.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/request/${id}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        {dispute ? (
          <DisputeStatus dispute={dispute} />
        ) : (
          <>
            <Card flat style={{ gap: 6 }}>
              <Row gap={10}><Icon name="shield" size={20} color={t.colors.danger} /><Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.dispute.openTitle')}</Text></Row>
              <Text variant="caption">{tr('actions.dispute.openHint')}</Text>
            </Card>
            <Field
              label={tr('actions.dispute.claimLabel')}
              value={claim}
              onChangeText={setClaim}
              placeholder={tr('actions.dispute.claimPlaceholder')}
              multiline
              voiceInput
              style={{ height: 110, textAlignVertical: 'top' }}
            />
            <SectionLabel>{tr('actions.dispute.evidenceLabel')}</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {photos.map((p, i) => <Image key={i} source={{ uri: p.uri }} style={{ width: 72, height: 72, borderRadius: 12 }} />)}
              {photos.length < 5 && (
                <Pressable onPress={addPhotos} style={{ width: 72, height: 72, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.line, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="camera" size={20} color={t.colors.accent} />
                </Pressable>
              )}
            </View>
            <Button title={tr('actions.dispute.submit')} variant="danger" full loading={open.isPending} onPress={submit} />
            <Text variant="caption" center>{tr('actions.dispute.retentionNotice')}</Text>
          </>
        )}
      </View>
    </Screen>
  );
}

function DisputeStatus({ dispute }: { dispute: Dispute }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const steps = ['open', 'under_review', 'resolved'] as const;
  const current = steps.indexOf(dispute.status);
  return (
    <>
      <Card style={{ gap: 10 }}>
        <Row>
          <Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.dispute.statusTitle')}</Text>
          <Badge label={tr(`actions.dispute.status.${dispute.status}`)} tone={dispute.status === 'resolved' ? 'live' : 'urgent'} dot />
        </Row>
        <Text variant="caption">{tr('actions.dispute.retentionNotice')}</Text>
      </Card>
      <Card style={{ gap: 14 }}>
        {steps.map((s, i) => (
          <Row key={s} gap={12}>
            <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: i <= current ? t.colors.accent : t.colors.surface2 }}>
              <Icon name={i < current ? 'check' : 'clock'} size={13} color={i <= current ? '#fff' : t.colors.ink3} />
            </View>
            <Text weight={i === current ? '800' : '600'} color={i <= current ? t.colors.ink : t.colors.ink3} style={{ fontSize: 14 }}>
              {tr(`actions.dispute.timeline.${s}`)}
            </Text>
          </Row>
        ))}
      </Card>
      {!!dispute.evidence?.length && (
        <View style={{ gap: 8 }}>
          <SectionLabel>{tr('actions.dispute.evidenceLabel')}</SectionLabel>
          {dispute.evidence.map((e, i) => (
            <Card key={i} flat style={{ gap: 6 }}>
              <Badge label={tr(`actions.dispute.party.${e.party}`)} tone="neutral" />
              {!!e.text && <Text style={{ fontSize: 13.5, lineHeight: 18 }} color={t.colors.ink2}>"{e.text}"</Text>}
              {!!e.photos?.length && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {e.photos.map((url, j) => <Image key={j} source={{ uri: url }} style={{ width: 64, height: 64, borderRadius: 10 }} />)}
                </View>
              )}
            </Card>
          ))}
        </View>
      )}
    </>
  );
}
