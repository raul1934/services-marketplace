import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Icon, Row, Screen, Text, useAuth, useTheme } from '@walvee/shared';

export default function Pending() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { user, logout, refresh } = useAuth();
  const first = user?.name?.split(' ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {/* hero */}
      <LinearGradient colors={t.grad as unknown as readonly [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ overflow: 'hidden' }}>
        <SafeAreaView edges={['top']} style={{ paddingHorizontal: 26, paddingTop: 24, paddingBottom: 30, alignItems: 'center' }}>
          <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.13)', top: -70, right: -60 }} />
          <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.13)', bottom: -40, left: -30 }} />
          <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name="clock" size={40} color="#fff" />
          </View>
          <Text weight="800" color="#fff" center style={{ fontSize: 24, letterSpacing: -0.4 }}>{tr('pending.title')}</Text>
          <Text color="rgba(255,255,255,0.92)" center style={{ fontSize: 14, marginTop: 8, lineHeight: 21 }}>
            {tr('pending.body', { name: first ?? '' })}
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <Screen padded={false} style={{ marginTop: 0 }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 16 }}>
          <Card style={{ gap: 0 }}>
            <LockStep node="done" title={tr('pending.step1Title')} body={tr('pending.step1Body')} line />
            <LockStep node="now" title={tr('pending.step2Title')} body={tr('pending.step2Body')} badge={tr('pending.inProgress')} line />
            <LockStep node="3" title={tr('pending.step3Title')} body={tr('pending.step3Body')} muted />
          </Card>

          <Row style={{ gap: 11, backgroundColor: t.colors.accentSoft, borderRadius: 14, padding: 13 }}>
            <Icon name="shield" size={19} color={t.colors.accent} />
            <Text style={{ flex: 1, fontSize: 12.5, fontWeight: '600' }} color={t.colors.accent}>{tr('pending.locked')}</Text>
          </Row>

          <Button title={tr('pending.goOnlineLocked')} variant="ghost" full left={<Icon name="power" size={18} color={t.colors.ink3} />} style={{ opacity: 0.6 }} />
          <Row gap={6} style={{ justifyContent: 'center' }}>
            <Text weight="700" color={t.colors.accent} onPress={refresh}>{tr('pending.refresh')}</Text>
            <Text variant="caption">·</Text>
            <Text weight="700" color={t.colors.ink3} onPress={logout}>{tr('common.logout')}</Text>
          </Row>
        </View>
      </Screen>
    </View>
  );
}

function LockStep({ node, title, body, badge, line, muted }: { node: 'done' | 'now' | string; title: string; body: string; badge?: string; line?: boolean; muted?: boolean }) {
  const t = useTheme();
  const isDone = node === 'done';
  const isNow = node === 'now';
  return (
    <Row style={{ gap: 13, alignItems: 'flex-start' }}>
      <View style={{ alignItems: 'center', alignSelf: 'stretch' }}>
        <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? t.colors.ok : isNow ? t.colors.accent : t.colors.surface2, borderWidth: isDone || isNow ? 0 : 1, borderColor: t.colors.line }}>
          {isDone ? <Icon name="check" size={14} color="#fff" /> : isNow ? <Icon name="search" size={14} color="#fff" /> : <Text weight="800" color={t.colors.ink3}>{node}</Text>}
        </View>
        {line && <View style={{ width: 2, flex: 1, backgroundColor: t.colors.line, marginVertical: 2 }} />}
      </View>
      <View style={{ flex: 1, paddingBottom: line ? 18 : 0 }}>
        <Row gap={8}>
          <Text weight="800" style={{ fontSize: 14.5 }} color={muted ? t.colors.ink3 : t.colors.ink}>{title}</Text>
          {badge ? <Badge label={badge} tone="open" /> : null}
        </Row>
        <Text variant="caption" style={{ marginTop: 2 }}>{body}</Text>
      </View>
    </Row>
  );
}
