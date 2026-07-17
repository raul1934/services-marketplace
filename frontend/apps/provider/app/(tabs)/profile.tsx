import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar, Badge, Button, Card, Icon, IconButton, LANGUAGES, Row, Screen, SectionLabel, Stars, THEME_MODES, Text, persistLanguage, useAuth, useTheme, useThemeControls } from '@chamafacil/shared';

export default function Profile() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { mode, setMode } = useThemeControls();
  const profile = user?.provider_profile;

  const pctRaw = (profile?.commission_rate ?? 0.05) * 100;
  const planPct = (Number.isInteger(pctRaw) ? String(pctRaw) : pctRaw.toFixed(1)).replace('.', i18n.language.startsWith('pt') ? ',' : '.');
  const fmtDate = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return i18n.language.startsWith('pt') ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
  };

  return (
    <Screen stickyHeader style={{ gap: 16 }}>
      <Row gap={8} style={{ paddingTop: 8 }}>
        <IconButton name="back" accessibilityLabel={tr('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))} />
        <Text variant="h1" style={{ flex: 1 }}>{tr('profile.title')}</Text>
      </Row>

      {/* identity card */}
      <Card style={{ gap: 14 }}>
        <Row>
          <Avatar name={user?.name} uri={user?.avatar_url} size={58} />
          <View style={{ flex: 1 }}>
            <Text variant="h3" numberOfLines={1}>{user?.name}</Text>
            {profile && (
              <Row gap={6} style={{ marginTop: 3 }}>
                <Stars value={profile.rating_avg} size={13} />
                <Text variant="caption">{tr('profile.jobsCount', { rating: profile.rating_avg.toFixed(1), count: profile.jobs_completed })}</Text>
              </Row>
            )}
          </View>
          {profile?.is_approved && <Badge label={tr('profile.verified')} tone="ok" />}
        </Row>
        <Row style={{ borderTopWidth: 1, borderColor: t.colors.line, paddingTop: 13, alignItems: 'stretch' }}>
          <Stat v={String(profile?.jobs_completed ?? 0)} k={tr('profile.statJobs')} />
          <View style={{ width: 1, backgroundColor: t.colors.line }} />
          <Stat v={`${(profile?.rating_avg ?? 0).toFixed(1)} ★`} k={tr('profile.statRating')} pad />
          <View style={{ width: 1, backgroundColor: t.colors.line }} />
          <Stat v={profile?.is_online ? tr('profile.online') : tr('profile.offline')} k={tr('profile.statStatus')} pad color={profile?.is_online ? t.colors.ok : t.colors.ink3} />
        </Row>
      </Card>

      {/* Plano atual */}
      {profile && (
        <>
          <SectionLabel>{tr('profile.planSection')}</SectionLabel>
          <Card style={{ gap: 12 }}>
            <Row gap={12}>
              <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="star" size={20} color={t.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text weight="800" style={{ fontSize: 15.5 }}>{tr(`profile.planNames.${profile.plan ?? 'free'}`)}</Text>
                <Text variant="caption">{tr('profile.planCommission', { pct: planPct })}</Text>
              </View>
              <Badge label={tr(`profile.planNames.${profile.plan ?? 'free'}`)} tone={profile.plan && profile.plan !== 'free' ? 'ok' : 'open'} />
            </Row>
            <Row style={{ borderTopWidth: 1, borderColor: t.colors.line, paddingTop: 11, gap: 8 }}>
              <Icon name="clock" size={15} color={t.colors.ink3} />
              <Text variant="caption" style={{ flex: 1 }}>
                {profile.plan_expires_at ? tr('profile.planValidUntil', { date: fmtDate(profile.plan_expires_at) }) : tr('profile.planNoExpiry')}
              </Text>
            </Row>
          </Card>
        </>
      )}

      {/* Perfil */}
      <SectionLabel>{tr('profile.sectionProfile')}</SectionLabel>
      <Card padded={false} style={{ paddingHorizontal: 16 }}>
        <MenuRow icon="edit" label={tr('profile.editProfile')} onPress={() => router.push('/edit-profile')} first />
        {user?.categories?.length ? (
          <MenuRow icon="briefcase" label={tr('profile.servicesYouOffer')} value={String(user.categories.length)} onPress={() => router.push('/config')} />
        ) : null}
      </Card>

      {/* Trabalho & pagamentos */}
      <SectionLabel>{tr('profile.sectionWork')}</SectionLabel>
      <Card padded={false} style={{ paddingHorizontal: 16 }}>
        <MenuRow icon="dollar" label={tr('profile.earnings')} onPress={() => router.push('/earnings')} first />
        <MenuRow icon="settings" label={tr('profile.settings')} onPress={() => router.push('/config')} />
      </Card>

      {/* App */}
      <SectionLabel>{tr('profile.sectionApp')}</SectionLabel>
      <Card style={{ gap: 12 }}>
        <Text variant="label">{tr('profile.appearance')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {THEME_MODES.map((m) => (
            <Button key={m} title={tr(`profile.themes.${m}`)} size="sm" variant={mode === m ? 'grad' : 'ghost'} onPress={() => setMode(m)} />
          ))}
        </View>
        <Text variant="label">{tr('profile.language')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {LANGUAGES.map((l) => (
            <Button key={l.code} title={l.label} size="sm" variant={i18n.language === l.code ? 'grad' : 'ghost'} onPress={() => { i18n.changeLanguage(l.code); persistLanguage(l.code); }} />
          ))}
        </View>
      </Card>

      <Button title={tr('common.logout')} variant="danger" full onPress={logout} />
    </Screen>
  );
}

function MenuRow({ icon, label, value, onPress, first }: { icon: string; label: string; value?: string; onPress: () => void; first?: boolean }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, borderTopWidth: first ? 0 : 1, borderColor: t.colors.line }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={t.colors.accent} />
      </View>
      <Text weight="700" style={{ flex: 1, fontSize: 14.5 }}>{label}</Text>
      {value ? <Text variant="caption" weight="700">{value}</Text> : null}
      <Icon name="fwd" size={18} color={t.colors.ink3} />
    </Pressable>
  );
}

function Stat({ v, k, pad, color }: { v: string; k: string; pad?: boolean; color?: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, paddingLeft: pad ? 14 : 0 }}>
      <Text style={{ fontSize: 17, fontWeight: t.headWeight, color: color ?? t.colors.ink, letterSpacing: -0.3 }} numberOfLines={1}>{v}</Text>
      <Text style={{ fontSize: 10.5, fontWeight: '700', color: t.colors.ink3, letterSpacing: 0.5, marginTop: 2 }}>{k.toUpperCase()}</Text>
    </View>
  );
}
