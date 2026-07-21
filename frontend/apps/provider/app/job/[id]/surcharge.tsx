import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BackBar, Badge, Button, Card, Field, Icon, Row, Screen, SectionLabel, Text, brl, useTheme,
} from '@chamafacil/shared';
import { useJob, useProposeSurcharge } from '../../../src/queries';
import { appendPhoto, pickPhotos, PickedPhoto } from '../../../src/photos';

const tierOf = (percent: number): 'simple' | 'reinforced' | 'requote' =>
  percent > 50 ? 'requote' : percent > 15 ? 'reinforced' : 'simple';

/** ProviderAddSurcharge (P15): provider composes a surcharge on the active job. */
export default function ProviderSurchargeScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useJob(requestId);
  const propose = useProposeSurcharge(requestId);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  const combinado = request?.accepted_proposal?.price ?? 0;
  const approvedSum = useMemo(
    () => (request?.surcharges ?? []).filter((s) => s.status === 'approved').reduce((sum, s) => sum + s.amount, 0),
    [request],
  );
  const amountNum = Number(amount.replace(',', '.')) || 0;
  const percent = combinado > 0 ? Math.round(((approvedSum + amountNum) / combinado) * 100) : 0;
  const tier = tierOf(percent);

  if (isLoading || !request) {
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
    if (amountNum <= 0) return Alert.alert(tr('common.error'), tr('actions.surcharge.amountError'));
    if (reason.trim().length < 5) return Alert.alert(tr('common.error'), tr('actions.surcharge.reasonError'));
    if (!photos.length) return Alert.alert(tr('common.error'), tr('actions.surcharge.photoError'));

    const form = new FormData();
    form.append('amount', String(amountNum));
    form.append('reason', reason.trim());
    for (const p of photos) await appendPhoto(form, 'photos[]', p);

    propose.mutate(form, {
      onSuccess: () => { Alert.alert(tr('common.ok'), tr('actions.surcharge.sentMsg')); router.back(); },
      onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
    });
  };

  return (
    <Screen stickyHeader padded={false}>
      <BackBar backLabel={tr('common.back')} title={tr('actions.surcharge.composeTitle')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/job/${requestId}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        <Card flat style={{ gap: 6 }}>
          <Text variant="caption">{tr('actions.surcharge.composeHint')}</Text>
        </Card>

        <Field label={tr('actions.surcharge.amountLabel')} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
        <Field
          label={tr('actions.surcharge.reasonLabel')}
          value={reason}
          onChangeText={setReason}
          placeholder={tr('actions.surcharge.reasonPlaceholder')}
          multiline
          voiceInput
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        <SectionLabel>{tr('actions.surcharge.photoLabel')}</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {photos.map((p, i) => <Image key={i} source={{ uri: p.uri }} style={{ width: 72, height: 72, borderRadius: 12 }} />)}
          {photos.length < 5 && (
            <Pressable onPress={addPhotos} style={{ width: 72, height: 72, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.line, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={20} color={t.colors.accent} />
            </Pressable>
          )}
        </View>

        {amountNum > 0 && (
          <Card>
            <Row style={{ paddingVertical: 5 }}>
              <Text style={{ flex: 1 }} color={t.colors.ink2} weight="600">{tr('actions.surcharge.combinado')}</Text>
              <Text weight="600">{brl(combinado)}</Text>
            </Row>
            <Row style={{ paddingVertical: 5 }}>
              <Text style={{ flex: 1 }} color={t.colors.ink2} weight="600">{tr('actions.surcharge.newTotal')}</Text>
              <Text weight="800">{brl(combinado + approvedSum + amountNum)}</Text>
            </Row>
            <Row gap={8} style={{ marginTop: 8 }}>
              <Badge label={tr(`actions.surcharge.tier.${tier}`)} tone={tier === 'requote' ? 'urgent' : 'neutral'} />
              <Text weight="700" color={tier === 'simple' ? t.colors.accent : t.colors.danger} style={{ fontSize: 12.5 }}>
                {tr('actions.surcharge.accumulated', { percent })}
              </Text>
            </Row>
            {tier === 'requote' && <Text variant="caption" style={{ marginTop: 6 }}>{tr('actions.surcharge.requoteHint')}</Text>}
          </Card>
        )}

        <Row gap={8} style={{ backgroundColor: t.colors.surface2, borderRadius: 12, padding: 12 }}>
          <Icon name="flash" size={16} color={t.colors.ink2} />
          <Text variant="caption" style={{ flex: 1 }}>{tr('actions.surcharge.matchWarning')}</Text>
        </Row>

        <Button title={tr('actions.surcharge.send')} full loading={propose.isPending} onPress={submit} />
      </View>
    </Screen>
  );
}
