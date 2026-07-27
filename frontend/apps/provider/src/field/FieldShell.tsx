import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppBar, AppDrawer, IconButton, useAuth, useTheme, type IconName } from '@chamafacil/shared';

/**
 * Per-section identity. Each field listing gets its own accent + icon so the
 * near-identical screens read as distinct places (wayfinding — the header chip
 * and the active drawer row share the same color). These are landmark colors,
 * deliberately kept off the cards so they don't collide with status semantics.
 */
export type FieldSection = 'routes' | 'sites' | 'performances';
export const SECTION: Record<FieldSection, { accent: string; icon: IconName }> = {
  routes: { accent: '#0ea5a5', icon: 'navigate' },       // teal — matches "Finalizar rota"
  sites: { accent: '#4f46e5', icon: 'location' },        // indigo — matches "Iniciar visita"
  performances: { accent: '#9333ea', icon: 'list' },     // roxo — histórico/gestão
};

/**
 * Chrome for the field-service module: a top AppBar with a hamburger that opens
 * the shared AppDrawer (a runtime overlay, no navigator dependency). The drawer
 * switches between the module's listings — routes, sites, site performances —
 * and the start-shift flow. Every field screen wraps its content in this.
 *
 * `section` drives the wayfinding landmark: the header identity chip and the
 * highlighted drawer row.
 */
export function FieldShell({ title, sub, section, footer, children }: { title: string; sub?: string; section?: FieldSection; footer?: React.ReactNode; children: React.ReactNode }) {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [drawer, setDrawer] = useState(false);

  const go = (path: string) => {
    setDrawer(false);
    router.replace(path);
  };

  // Logout is destructive to the shift context — confirm before dropping it (NAV-02).
  const confirmLogout = () => {
    Alert.alert(tr('drawer.logout'), tr('drawer.logoutConfirm'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('drawer.logout'), style: 'destructive', onPress: () => { setDrawer(false); logout(); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <AppBar
          title={title}
          sub={sub}
          accent={section ? SECTION[section].accent : undefined}
          icon={section ? SECTION[section].icon : undefined}
          left={<IconButton name="menu" accessibilityLabel={tr('common.menu')} onPress={() => setDrawer(true)} />}
        />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 + insets.bottom }} showsVerticalScrollIndicator>
        {children}
      </ScrollView>

      {/* Optional sticky footer (e.g. the end-shift slider on Rotas). */}
      {footer ? (
        <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.colors.line, backgroundColor: t.colors.surface }}>
          {footer}
        </SafeAreaView>
      ) : null}

      <AppDrawer
        visible={drawer}
        onClose={() => setDrawer(false)}
        name={user?.name}
        subtitle={user?.provider_profile?.company_name ?? undefined}
        avatarUri={user?.avatar_url}
        sections={[
          {
            title: tr('fieldNav.section'),
            items: [
              { icon: 'navigate', label: tr('fieldNav.routes'), accent: SECTION.routes.accent, active: section === 'routes', onPress: () => go('/(field)/routes') },
              { icon: 'location', label: tr('fieldNav.sites'), accent: SECTION.sites.accent, active: section === 'sites', onPress: () => go('/(field)/sites') },
              { icon: 'list', label: tr('fieldNav.performances'), accent: SECTION.performances.accent, active: section === 'performances', onPress: () => go('/(field)/performances') },
            ],
          },
          {
            title: tr('fieldNav.shiftSection'),
            items: [{ icon: 'clock', label: tr('field.startTitle'), onPress: () => go('/(field)/shift') }],
          },
        ]}
        footer={{ icon: 'power', label: tr('drawer.logout'), danger: true, onPress: confirmLogout }}
      />
    </View>
  );
}
