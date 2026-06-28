import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, AuthField, BrandMark, Button, DividerOr, GoogleButton, Icon, Screen, Segment, Text, useAuth, useGoogleSignIn, useTheme } from '@walvee/shared';

type Mode = 'phone' | 'email';

export default function Login() {
  const t = useTheme();
  const { login, requestOtp } = useAuth();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const google = useGoogleSignIn();
  const [mode, setMode] = useState<Mode>(__DEV__ ? 'email' : 'phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(__DEV__ ? 'cliente@walvee.test' : '');
  const [password, setPassword] = useState(__DEV__ ? 'senha123' : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      if (mode === 'phone') {
        const digits = '55' + phone.replace(/\D/g, '');
        const res = await requestOtp(digits);
        router.push({ pathname: '/(auth)/verify', params: { phone: digits, debug: res.debug_code ?? '' } });
      } else {
        await login(email.trim(), password);
      }
    } catch (e) {
      if (e instanceof ApiError && e.errors && Object.keys(e.errors).length) {
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(e.errors)) fieldErrors[field] = messages[0];
        setErrors(fieldErrors);
      } else {
        setFormError(e instanceof ApiError ? e.message : (e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false} padded={false}>
      <View style={{ paddingHorizontal: 26, paddingTop: 18 }}>
        <BrandMark />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 8, paddingBottom: 26, gap: 13 }}>
        <View>
          <Text style={{ fontSize: 27, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.6, lineHeight: 30 }}>{tr('login.title')}</Text>
          <Text style={{ color: t.colors.ink2, fontSize: 14, marginTop: 5 }}>{tr('login.subtitle')}</Text>
        </View>

        <Segment<Mode>
          value={mode}
          onChange={(m) => { setMode(m); setErrors({}); setFormError(null); }}
          items={[
            { value: 'phone', label: tr('login.tabPhone') },
            { value: 'email', label: tr('login.tabEmail') },
          ]}
        />

        {mode === 'phone' ? (
          <AuthField icon="phone" prefix="+55" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={tr('login.phonePlaceholder')} error={errors.phone} />
        ) : (
          <>
            <AuthField icon="mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder={tr('login.emailPlaceholder')} error={errors.email} />
            <AuthField icon="key" value={password} onChangeText={setPassword} secureTextEntry placeholder={tr('login.passwordPlaceholder')} error={errors.password} />
          </>
        )}

        {formError ? <Text variant="caption" color={t.colors.danger}>{formError}</Text> : null}

        <Button title={mode === 'phone' ? tr('login.sendCode') : tr('login.submit')} full loading={loading} onPress={submit} right={<Icon name="arrowR" size={18} color={t.colors.accentInk} />} style={{ marginTop: 4 }} />

        <DividerOr label={tr('common.or')} />
        <GoogleButton label={tr('common.googleContinue')} loading={google.loading} onPress={google.signIn} />
        {google.error ? <Text variant="caption" color={t.colors.danger} center>{google.error}</Text> : null}

        <View style={{ flex: 1 }} />

        <Text center style={{ fontSize: 13.5, fontWeight: '600', color: t.colors.ink2 }}>
          {tr('login.toRegisterPrefix')} <Text color={t.colors.accent} weight="800" onPress={() => router.push('/(auth)/register')}>{tr('login.toRegisterLink')}</Text>
        </Text>
      </View>
    </Screen>
  );
}
