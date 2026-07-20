import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { addNotificationResponseListener, AuthProvider, ThemeProvider, UpdateBanner, useAuth, usePushSync, useNotificationChime, useRealtimeNotifications, useSystemBars, useTheme } from '@chamafacil/shared';
import { authApi, pushApi } from '../src/api';
import { initServices } from '../src/init';
import '../src/i18n';

initServices();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

function Gate() {
  const { status, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const t = useTheme();
  const qc = useQueryClient();

  // Android's nav bar icons follow the app theme (invisible otherwise).
  useSystemBars();
  const chime = useNotificationChime();

  usePushSync(status === 'authed', pushApi);

  // Live UI refresh from WebSocket notifications.
  useRealtimeNotifications(status === 'authed' ? user?.id : null, (n) => {
    // A new job in the feed is worth hearing — the provider is usually driving
    // or working, not watching the list.
    chime();

    const rid = n.request_id ? Number(n.request_id) : null;
    qc.invalidateQueries({ queryKey: ['jobs'] });
    qc.invalidateQueries({ queryKey: ['bids'] });
    qc.invalidateQueries({ queryKey: ['nearby'] });
    if (rid) {
      qc.invalidateQueries({ queryKey: ['job', rid] });
      qc.invalidateQueries({ queryKey: ['questions', rid] });
      qc.invalidateQueries({ queryKey: ['dispute', rid] });
      qc.invalidateQueries({ queryKey: ['wallet'] }); // payment_settled / dispute hold
    }
  });

  // Deep-link: tapping a push (background/quit) opens the relevant job.
  useEffect(() => {
    if (status !== 'authed') return;
    return addNotificationResponseListener((data) => {
      const rid = data.request_id ? Number(data.request_id) : null;
      if (rid) router.push(`/job/${rid}`);
    });
  }, [status, router]);

  useEffect(() => {
    if (status === 'loading') return;
    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (status === 'guest') {
      if (!inAuth) router.replace('/(auth)/welcome');
      return;
    }
    // Authed flow: no categories → onboarding; submitted but not yet approved
    // → pending lock; approved → dashboard.
    const inPending = segments[0] === 'pending';
    const hasCategories = !!user?.categories?.length;
    const approved = !!user?.provider_profile?.is_approved;

    if (!hasCategories) {
      if (!inOnboarding) router.replace('/onboarding');
    } else if (!approved) {
      if (!inPending) router.replace('/pending');
    } else if (inAuth || inOnboarding || inPending) {
      router.replace('/(tabs)/dashboard');
    }
  }, [status, user, segments, router]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.bg }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </View>
    );
  }
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <UpdateBanner app="provider" />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, SpaceMono_400Regular, SpaceMono_700Bold });
  useEffect(() => { if (fontError) console.warn('[fonts] load error:', fontError); }, [fontError]);
  // Don't block the app forever if fonts fail to load — render with system fonts.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initial="trust">
            <AuthProvider role="provider" api={authApi}>
              <Gate />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
