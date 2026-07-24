import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppBar, AppDrawer, IconButton, useAuth, useTheme } from '@chamafacil/shared';

/**
 * Chrome for the field-service module: a top AppBar with a hamburger that opens
 * the shared AppDrawer (a runtime overlay, no navigator dependency). The drawer
 * switches between the module's listings — routes, sites, site performances —
 * and the start-shift flow. Every field screen wraps its content in this.
 */
export function FieldShell({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { user, logout } = useAuth();
  const [drawer, setDrawer] = useState(false);

  const go = (path: string) => {
    setDrawer(false);
    router.replace(path);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <AppBar
          title={title}
          sub={sub}
          left={<IconButton name="menu" accessibilityLabel={tr('common.menu')} onPress={() => setDrawer(true)} />}
        />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>

      <AppDrawer
        visible={drawer}
        onClose={() => setDrawer(false)}
        name={user?.name ?? 'Anderson Lima'}
        subtitle="Prumo Manutenção Predial · Líder"
        avatarUri={user?.avatar_url}
        sections={[
          {
            title: tr('fieldNav.section'),
            items: [
              { icon: 'navigate', label: tr('fieldNav.routes'), onPress: () => go('/(field)/routes') },
              { icon: 'location', label: tr('fieldNav.sites'), onPress: () => go('/(field)/sites') },
              { icon: 'list', label: tr('fieldNav.performances'), onPress: () => go('/(field)/performances') },
            ],
          },
          {
            title: tr('fieldNav.shiftSection'),
            items: [{ icon: 'clock', label: tr('field.startTitle'), onPress: () => go('/(field)/shift') }],
          },
        ]}
        footer={{ icon: 'power', label: tr('drawer.logout'), danger: true, onPress: logout }}
      />
    </View>
  );
}
