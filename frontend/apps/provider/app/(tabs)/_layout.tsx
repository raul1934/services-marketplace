import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, useTheme } from '@chamafacil/shared';

export default function TabsLayout() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.accent,
        tabBarInactiveTintColor: t.colors.ink3,
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.line,
          height: 84,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: tr('tabs.dashboard'), tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="nearby"
        options={{ title: tr('tabs.nearby'), tabBarIcon: ({ color, size }) => <Icon name="search" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: tr('tabs.jobs'), tabBarIcon: ({ color, size }) => <Icon name="briefcase" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="agenda"
        options={{ title: tr('tabs.agenda'), tabBarIcon: ({ color, size }) => <Icon name="calendar" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ href: null, title: tr('tabs.profile'), tabBarIcon: ({ color, size }) => <Icon name="user" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
