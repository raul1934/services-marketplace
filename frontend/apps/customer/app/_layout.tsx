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
import { addNotificationResponseListener, AuthProvider, ThemeProvider, useAuth, usePushSync, useRealtimeNotifications, useTheme } from '@chamafacil/shared';
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

  usePushSync(status === 'authed', pushApi);

  // Live UI refresh: a notification over WebSocket invalidates the affected caches.
  useRealtimeNotifications(status === 'authed' ? user?.id : null, (n) => {
    const rid = n.request_id ? Number(n.request_id) : null;
    qc.invalidateQueries({ queryKey: ['requests'] });
    if (rid) {
      qc.invalidateQueries({ queryKey: ['request', rid] });
      qc.invalidateQueries({ queryKey: ['questions', rid] });
      qc.invalidateQueries({ queryKey: ['proposals', rid] });
      qc.invalidateQueries({ queryKey: ['tracking', rid] });
      // New action surfaces (surcharge/reschedule live on the request object).
      qc.invalidateQueries({ queryKey: ['dispute', rid] });
      qc.invalidateQueries({ queryKey: ['warranty', rid] });
    }
  });

  // Deep-link: tapping a push (background/quit) opens the relevant request.
  useEffect(() => {
    if (status !== 'authed') return;
    return addNotificationResponseListener((data) => {
      const rid = data.request_id ? Number(data.request_id) : null;
      if (rid) router.push(`/request/${rid}`);
    });
  }, [status, router]);

  useEffect(() => {
    if (status === 'loading') return;
    const inAuth = segments[0] === '(auth)';
    if (status === 'guest' && !inAuth) router.replace('/(auth)/welcome');
    else if (status === 'authed' && inAuth) router.replace('/(tabs)/home');
  }, [status, segments, router]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.bg }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false }} />;
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
          <ThemeProvider initial="sunset">
            <AuthProvider role="client" api={authApi}>
              <Gate />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
