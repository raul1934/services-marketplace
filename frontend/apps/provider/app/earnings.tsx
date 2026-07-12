import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Alert } from '@chamafacil/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Button, Card, Icon, Row, Screen, SectionLabel, Text, brl, flattenPages, useTheme } from '@chamafacil/shared';
import { useWallet, useWalletTransactions, useWithdraw } from '../src/queries';
import { WalletTxn } from '../src/api';

export default function Earnings() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const wallet = useWallet();
  const txns = useWalletTransactions();
  const withdraw = useWithdraw();

  const w = wallet.data;
  const transactions = flattenPages(txns.data?.pages);
  const canWithdraw = (w?.balance ?? 0) > 0 && !withdraw.isPending;

  const onWithdraw = () => {
    withdraw.mutate(undefined, {
      onSuccess: (r) => Alert.alert(tr('common.thanks'), r.message),
      onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
    });
  };

  return (
    <Screen
      stickyHeader
      padded={false}
      onEndReached={() => { if (txns.hasNextPage && !txns.isFetchingNextPage) txns.fetchNextPage(); }}
    >
      <BackBar title={tr('earnings.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
      {wallet.isLoading || !w ? (
        <ActivityIndicator color={t.colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16 }}>
          {/* available balance */}
          <LinearGradient colors={t.grad as unknown as readonly [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: t.radius.card, padding: 20, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.14)' }} />
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 }}>{tr('earnings.available')}</Text>
            <Text style={{ fontSize: 38, fontWeight: t.headWeight, color: '#fff', letterSpacing: -0.5, marginTop: 4 }}>{brl(w.balance)}</Text>
          </LinearGradient>

          <Button title={tr('earnings.withdrawPix')} full disabled={!canWithdraw} loading={withdraw.isPending} onPress={onWithdraw} left={<Icon name="pix" size={18} color={t.colors.accentInk} />} />

          {/* month stats */}
          <Card>
            <Row style={{ alignItems: 'stretch' }}>
              <Stat v={brl(w.month_earnings)} k={tr('earnings.month')} />
              <View style={{ width: 1, backgroundColor: t.colors.line }} />
              <Stat v={String(w.month_jobs)} k={tr('earnings.jobs')} pad />
              <View style={{ width: 1, backgroundColor: t.colors.line }} />
              <Stat v={brl(w.month_fee)} k={tr('earnings.fee')} pad />
            </Row>
          </Card>

          {/* recent activity */}
          <SectionLabel>{tr('earnings.recent')}</SectionLabel>
          {txns.isLoading ? (
            <ActivityIndicator color={t.colors.accent} style={{ marginTop: 10 }} />
          ) : transactions.length === 0 ? (
            <Card flat style={{ alignItems: 'center', paddingVertical: 22, gap: 6 }}>
              <Text style={{ fontSize: 30 }}>💸</Text>
              <Text variant="caption" center>{tr('earnings.empty')}</Text>
            </Card>
          ) : (
            <Card padded={false} style={{ paddingHorizontal: 16 }}>
              {transactions.map((txn: WalletTxn, i) => {
                const credit = txn.type === 'credit';
                return (
                  <Row key={txn.id} style={{ paddingVertical: 13, borderTopWidth: i ? 1 : 0, borderColor: t.colors.line, gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: credit ? t.colors.okSoft : t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={credit ? 'arrowR' : 'pix'} size={16} color={credit ? t.colors.ok : t.colors.ink2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text weight="700" style={{ fontSize: 13.5 }} numberOfLines={1}>{txn.description ?? (credit ? tr('earnings.creditLabel') : tr('earnings.payoutLabel'))}</Text>
                      <Text variant="caption">{new Date(txn.created_at).toLocaleDateString('pt-BR')}</Text>
                    </View>
                    <Text weight="800" style={{ fontSize: 14 }} color={credit ? t.colors.ok : t.colors.ink}>
                      {credit ? '+ ' : '− '}{brl(txn.amount)}
                    </Text>
                  </Row>
                );
              })}
            </Card>
          )}

          {txns.isFetchingNextPage && <ActivityIndicator color={t.colors.accent} style={{ marginVertical: 8 }} />}
        </View>
      )}
    </Screen>
  );
}

function Stat({ v, k, pad }: { v: string; k: string; pad?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, paddingLeft: pad ? 16 : 0 }}>
      <Text style={{ fontSize: 18, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.4 }} numberOfLines={1}>{v}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: t.colors.ink3, letterSpacing: 0.5, marginTop: 2 }}>{k.toUpperCase()}</Text>
    </View>
  );
}
