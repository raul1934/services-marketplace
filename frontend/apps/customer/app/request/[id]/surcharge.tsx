import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { SkeletonScreen, Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BackBar, Badge, Button, Card, EmptyState, Icon, Row, Screen, SectionLabel, SlideToConfirm, Surcharge, Text, brl, useTheme,
} from '@chamafacil/shared';
import { useRequest, useResolveSurcharge } from '../../../src/queries';

/** V3Acrescimo (C16): client approves/refuses the provider's surcharge. */
export default function SurchargeScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useRequest(requestId);
  const resolve = useResolveSurcharge(requestId);

  if (isLoading || !request) return <SkeletonScreen />;

  const combinado = request.accepted_proposal?.price ?? 0;
  const all = request.surcharges ?? [];
  const pending = all.find((s) => s.status === 'pending');
  const approvedSum = all.filter((s) => s.status === 'approved').reduce((sum, s) => sum + s.amount, 0);

  const onResolve = (surchargeId: number, approve: boolean) =>
    resolve.mutate(
      { surchargeId, approve },
      {
        onSuccess: () => {
          Alert.alert(tr('common.ok'), tr(approve ? 'actions.surcharge.approvedMsg' : 'actions.surcharge.refusedMsg'));
          router.back();
        },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );

  const newTotal = pending ? combinado + approvedSum + pending.amount : 0;

  // Primary decision pinned to the bottom (consistent with the other screens).
  const footer = pending ? (
    pending.tier === 'requote' ? (
      <Button title={tr('actions.surcharge.goRequote')} full onPress={() => router.replace(`/request/${requestId}/requote`)} />
    ) : (
      <View style={{ gap: 8 }}>
        <SlideToConfirm
          label={tr('actions.surcharge.slideApprove', { value: brl(newTotal) })}
          doneLabel={tr('actions.surcharge.slideApproved')}
          disabled={resolve.isPending}
          onConfirm={() => onResolve(pending.id, true)}
          confirmHint={tr('common.slideHint')}
        />
        <Button title={tr('actions.surcharge.refuse')} variant="ghost" full onPress={() => onResolve(pending.id, false)} />
      </View>
    )
  ) : undefined;

  return (
    <Screen stickyHeader padded={false} footer={footer}>
      <BackBar backLabel={tr('common.back')} title={tr('actions.surcharge.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/request/${id}`))} />
      <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        {!pending ? (
          <EmptyState fill tone="muted" icon="check" title={tr('actions.surcharge.nonePending')} />
        ) : (
          <PendingSurcharge surcharge={pending} combinado={combinado} approvedSum={approvedSum} />
        )}
      </View>
    </Screen>
  );
}

function PendingSurcharge({
  surcharge, combinado, approvedSum,
}: {
  surcharge: Surcharge; combinado: number; approvedSum: number;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const newTotal = combinado + approvedSum + surcharge.amount;
  const tierTone = surcharge.tier === 'simple' ? t.colors.accent : t.colors.danger;

  return (
    <>
      {/* Provider reason + photos */}
      <Card style={{ gap: 10 }}>
        <Row gap={10}>
          <Icon name="flash" size={20} color={tierTone} />
          <Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.surcharge.proposedTitle')}</Text>
          <Badge label={tr(`actions.surcharge.tier.${surcharge.tier}`)} tone={surcharge.tier === 'requote' ? 'urgent' : 'neutral'} />
        </Row>
        <Text style={{ fontSize: 14, lineHeight: 19 }} color={t.colors.ink2}>"{surcharge.reason}"</Text>
        {!!surcharge.photos?.length && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {surcharge.photos.map((url, i) => (
              <Image key={i} source={{ uri: url }} style={{ width: 76, height: 76, borderRadius: 12 }} />
            ))}
          </View>
        )}
      </Card>

      {/* Breakdown */}
      <Card>
        <Line k={tr('actions.surcharge.combinado')} v={brl(combinado)} />
        {approvedSum > 0 && <Line k={tr('actions.surcharge.prevSurcharges')} v={`+ ${brl(approvedSum)}`} />}
        <Line k={tr('actions.surcharge.thisSurcharge')} v={`+ ${brl(surcharge.amount)}`} accent />
        <View style={{ height: 1, backgroundColor: t.colors.line, marginVertical: 6 }} />
        <Row>
          <Text weight="800" style={{ flex: 1 }}>{tr('actions.surcharge.newTotal')}</Text>
          <Text weight="800" style={{ fontSize: 18 }}>{brl(newTotal)}</Text>
        </Row>
        <Row gap={6} style={{ marginTop: 8 }}>
          <Icon name="flash" size={14} color={tierTone} />
          <Text weight="700" color={tierTone} style={{ fontSize: 12.5 }}>
            {tr('actions.surcharge.accumulated', { percent: Math.round(surcharge.percent_accumulated) })}
          </Text>
        </Row>
      </Card>

      {surcharge.tier === 'reinforced' && (
        <Row gap={8} style={{ backgroundColor: t.colors.dangerSoft, borderRadius: 12, padding: 12 }}>
          <Icon name="flash" size={16} color={t.colors.danger} />
          <Text weight="700" color={t.colors.danger} style={{ flex: 1, fontSize: 12.5 }}>{tr('actions.surcharge.reinforcedWarning')}</Text>
        </Row>
      )}

      {surcharge.tier === 'requote' ? (
        <Card flat style={{ gap: 10, alignItems: 'center', paddingVertical: 18 }}>
          <Text variant="caption" center>{tr('actions.surcharge.requoteNotice')}</Text>
        </Card>
      ) : (
        <Text variant="caption" center>{tr('actions.surcharge.refuseHint')}</Text>
      )}
    </>
  );
}

function Line({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  const t = useTheme();
  return (
    <Row style={{ paddingVertical: 7 }}>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600' }} color={t.colors.ink2}>{k}</Text>
      <Text style={{ fontSize: 14 }} color={accent ? t.colors.accent : t.colors.ink} weight={accent ? '800' : '600'}>{v}</Text>
    </Row>
  );
}
