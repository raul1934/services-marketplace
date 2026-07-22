import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, AuthField, BrandMark, Button, DividerOr, GoogleButton, Icon, Screen, Segment, Text, isValidPhoneBR, maskPhoneBR, toE164BR, useAuth, useGoogleSignIn, useTheme } from '@chamafacil/shared';
import { EnvSwitch } from '../../src/components/EnvSwitch';
import { currentHost } from '../../src/env';

type Mode = 'phone' | 'email';

export default function Login() {
  const t = useTheme();
  const { login, requestOtp } = useAuth();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const google = useGoogleSignIn();
  // Same tab in dev and in production. It used to open on e-mail under
  // __DEV__, which meant every developer exercised a different first screen
  // from every user — the one path nobody was dogfooding was the default one.
  // The dev credential prefill below stays; reaching it is one tap.
  const [mode, setMode] = useState<Mode>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(__DEV__ ? 'cliente@chamafacil.test' : '');
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
        // Caught here rather than by the OTP never arriving. A typo used to
        // look exactly like a slow SMS, and the user has no way to tell those
        // apart — they just wait, then try again with the same wrong number.
        if (!isValidPhoneBR(phone)) {
          setErrors({ phone: tr('login.phoneInvalid') });
          setLoading(false);
          return;
        }
        const digits = toE164BR(phone);
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
      <View style={{ paddingHorizontal: 26, paddingTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BrandMark />
        <EnvSwitch />
      </View>
      {/* `Screen scroll={false}` means the layout cannot get out of the
          keyboard's way on its own: on a small phone the keyboard covered the
          password field and the submit button, and nothing scrolled. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
          <AuthField icon="phone" label={tr('login.tabPhone')} prefix="+55" value={phone} onChangeText={(v) => setPhone(maskPhoneBR(v))} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" placeholder={tr('login.phonePlaceholder')} error={errors.phone} />
        ) : (
          <>
            <AuthField icon="mail" label={tr('login.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" autoComplete="email" placeholder={tr('login.emailPlaceholder')} error={errors.email} />
            <AuthField icon="key" label={tr('login.password')} value={password} onChangeText={setPassword} secureTextEntry revealLabel={tr('common.showPassword')} hideLabel={tr('common.hidePassword')} textContentType="password" autoComplete="current-password" placeholder={tr('login.passwordPlaceholder')} error={errors.password} />
          </>
        )}

        {formError ? (
          <View style={{ gap: 2 }}>
            <Text variant="caption" color={t.colors.danger}>{formError}</Text>
            {/* Backend host is a debugging aid only — never expose it to end users. */}
            {__DEV__ ? <Text variant="caption" color={t.colors.ink3}>API: {currentHost()}</Text> : null}
          </View>
        ) : null}

        <Button title={mode === 'phone' ? tr('login.sendCode') : tr('login.submit')} full loading={loading} onPress={submit} right={<Icon name="arrowR" size={18} color={t.colors.accentInk} />} style={{ marginTop: 4 }} />

        {/* Hide the whole "or / Google" block when the SDK isn't configured:
            the button could only ever fail, and a lone divider reads as a bug. */}
        {google.available ? (
          <>
            <DividerOr label={tr('common.or')} />
            <GoogleButton label={tr('common.googleContinue')} loading={google.loading} onPress={google.signIn} />
            {google.error ? <Text variant="caption" color={t.colors.danger} center>{google.error}</Text> : null}
          </>
        ) : null}

        <View style={{ flex: 1 }} />

        <Text center style={{ fontSize: 13.5, fontWeight: '600', color: t.colors.ink2 }}>
          {tr('login.toRegisterPrefix')} <Text accessibilityRole="link" suppressHighlighting color={t.colors.accent} weight="800" onPress={() => router.push('/(auth)/register')}>{tr('login.toRegisterLink')}</Text>
        </Text>
      </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
