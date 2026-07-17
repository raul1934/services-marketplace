import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar, Button, Card, Icon, LANGUAGES, Row, Screen, THEME_MODES, Text, persistLanguage, useAuth, useTheme, useThemeControls } from '@chamafacil/shared';

export default function Profile() {
  const { user, logout } = useAuth();
  const { mode, setMode } = useThemeControls();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const th = useTheme();

  return (
    <Screen stickyHeader style={{ gap: 16 }}>
      <View style={{ paddingTop: 16 }}>
        <Text variant="h1">{t('profile.title')}</Text>
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar name={user?.name} uri={user?.avatar_url} size={60} />
        <View style={{ flex: 1 }}>
          <Text variant="h3">{user?.name}</Text>
          <Text variant="caption">{user?.email ?? user?.phone}</Text>
        </View>
      </Card>

      <Card onPress={() => router.push('/assets')}>
        <Row gap={12}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: th.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="car" size={22} color={th.colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text weight="800" style={{ fontSize: 15 }}>{t('assets.title')}</Text>
            <Text variant="caption">{t('assets.menuSub')}</Text>
          </View>
          <Icon name="arrowR" size={18} color={th.colors.ink3} />
        </Row>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text variant="label">{t('profile.appearance')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {THEME_MODES.map((m) => (
            <Button
              key={m}
              title={t(`profile.themes.${m}`)}
              size="sm"
              variant={mode === m ? 'grad' : 'ghost'}
              onPress={() => setMode(m)}
            />
          ))}
        </View>
        <Text variant="label">{t('profile.language')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {LANGUAGES.map((l) => (
            <Button
              key={l.code}
              title={l.label}
              size="sm"
              variant={i18n.language === l.code ? 'grad' : 'ghost'}
              onPress={() => {
                i18n.changeLanguage(l.code);
                persistLanguage(l.code);
              }}
            />
          ))}
        </View>
      </Card>

      <Button title={t('profile.logout')} variant="danger" full onPress={logout} />
    </Screen>
  );
}
