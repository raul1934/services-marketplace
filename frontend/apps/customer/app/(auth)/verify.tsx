import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, BackBar, Button, OtpInput, Screen, Text, useAuth, useTheme } from '@chamafacil/shared';

export default function Verify() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { verifyOtp, requestOtp } = useAuth();
  const params = useLocalSearchParams<{ phone: string; debug?: string }>();
  const phone = String(params.phone ?? '');

  // Prefill with the debug code outside production so the flow is testable.
  const [code, setCode] = useState(String(params.debug ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(24);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const verify = async (value: string) => {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(phone, value);
      // On success the auth status flips to "authed" and the root layout redirects.
    } catch (e) {
      setError(e instanceof ApiError ? (e.fieldError('code') ?? e.message) : (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (v: string) => {
    setCode(v);
    if (v.length === 6) verify(v);
  };

  const resend = async () => {
    if (seconds > 0) return;
    setError(null);
    try {
      const res = await requestOtp(phone);
      setSeconds(24);
      if (res.debug_code) setCode(res.debug_code);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const pretty = phone.startsWith('55') ? '+55 ' + phone.slice(2) : '+' + phone;

  return (
    <Screen stickyHeader scroll={false} padded={false}>
      <BackBar title={tr('otp.header')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))} />
      <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 8, gap: 18 }}>
        <View>
          <Text style={{ fontSize: 27, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.6 }}>{tr('otp.title')}</Text>
          <Text style={{ color: t.colors.ink2, fontSize: 14, marginTop: 6 }}>{tr('otp.subtitle', { phone: pretty })}</Text>
        </View>

        <OtpInput value={code} onChange={onChange} />

        {error ? <Text variant="caption" color={t.colors.danger} center>{error}</Text> : null}

        <Button title={tr('otp.verify')} full loading={loading} disabled={code.length < 6} onPress={() => verify(code)} />

        <Text center style={{ fontSize: 13.5, fontWeight: '600', color: t.colors.ink2 }}>
          {seconds > 0 ? (
            tr('otp.resendIn', { seconds })
          ) : (
            <Text color={t.colors.accent} weight="800" onPress={resend}>{tr('otp.resend')}</Text>
          )}
        </Text>
        <View style={{ flex: 1 }} />

        <Text center style={{ fontSize: 11, color: t.colors.ink3, lineHeight: 16 }}>
          {tr('otp.wrongNumber')} <Text color={t.colors.ink2} weight="700" onPress={() => router.back()}>{tr('otp.edit')}</Text>
        </Text>
      </View>
    </Screen>
  );
}
