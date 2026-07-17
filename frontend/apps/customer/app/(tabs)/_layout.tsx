import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, useTheme } from '@chamafacil/shared';

/** Bar height above the system inset — room for a 24px icon plus its label. */
const TAB_BAR_H = 60;

export default function TabsLayout() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  // Android's nav buttons (and the iOS home indicator) sit inside the tab bar's
  // own footprint, so the bar has to grow by the inset and pad its content past
  // it. A fixed height would draw the labels underneath them.
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.accent,
        tabBarInactiveTintColor: t.colors.ink3,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.line,
          height: TAB_BAR_H + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: tr('tabs.home'), tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="requests"
        options={{ title: tr('tabs.requests'), tabBarIcon: ({ color, size }) => <Icon name="list" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: tr('tabs.profile'), tabBarIcon: ({ color, size }) => <Icon name="user" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
