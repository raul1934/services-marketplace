import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, AuthField, BrandMark, Button, DividerOr, GoogleButton, Icon, Screen, Text, useAuth, useTheme } from '@chamafacil/shared';
import { config } from '../../src/config';

export default function Register() {
  const t = useTheme();
  const { register } = useAuth();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setErrors({});
    setFormError(null);
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, password: form.password });
    } catch (e) {
      if (e instanceof ApiError && e.errors && Object.keys(e.errors).length) {
        setErrors(Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k, v[0]])));
      } else {
        setFormError(e instanceof ApiError ? e.message : (e as Error).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen padded={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 26, paddingTop: 18 }}>
        <BrandMark />
        <Text weight="800" color={t.colors.ink3} style={{ fontSize: 18 }}>pro</Text>
      </View>
      <View style={{ paddingHorizontal: 26, paddingTop: 8, paddingBottom: 26, gap: 13 }}>
        <View>
          <Text style={{ fontSize: 27, fontWeight: t.headWeight, color: t.colors.ink, letterSpacing: -0.6 }}>{tr('register.title')}</Text>
          <Text style={{ color: t.colors.ink2, fontSize: 14, marginTop: 5 }}>{tr('register.subtitle')}</Text>
        </View>

        <AuthField icon="user" value={form.name} onChangeText={set('name')} placeholder={tr('register.namePlaceholder')} error={errors.name} />
        <AuthField icon="mail" value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" placeholder={tr('register.emailPlaceholder')} error={errors.email} />
        <AuthField icon="phone" prefix="+55" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder={tr('register.phonePlaceholder')} error={errors.phone} />
        <AuthField icon="key" value={form.password} onChangeText={set('password')} secureTextEntry revealLabel={tr('common.showPassword')} hideLabel={tr('common.hidePassword')} placeholder={tr('register.passwordPlaceholder')} error={errors.password} />

        {formError ? <Text variant="caption" color={t.colors.danger}>{formError}</Text> : null}

        <Button title={tr('register.submit')} full loading={loading} onPress={submit} right={<Icon name="arrowR" size={18} color={t.colors.accentInk} />} style={{ marginTop: 4 }} />
        <DividerOr label={tr('common.or')} />
        <GoogleButton label={tr('common.googleSignup')} />

        {/* Was a flat sentence: it told people they were agreeing to two
            documents and gave them no way to read either one. Legal problem
            before it is an accessibility one. */}
        <Text center style={{ fontSize: 11, color: t.colors.ink3, lineHeight: 16, marginTop: 4 }}>
          {tr('register.legalPrefix')}{' '}
          <Text
            accessibilityRole="link"
            suppressHighlighting
            color={t.colors.accent}
            weight="700"
            onPress={() => Linking.openURL(config.legal.terms)}
          >
            {tr('register.legalTerms')}
          </Text>{' '}
          {tr('register.legalMiddle')}{' '}
          <Text
            accessibilityRole="link"
            suppressHighlighting
            color={t.colors.accent}
            weight="700"
            onPress={() => Linking.openURL(config.legal.privacy)}
          >
            {tr('register.legalPrivacy')}
          </Text>{' '}
          {tr('register.legalSuffix')}
        </Text>
        <Text center style={{ fontSize: 13.5, fontWeight: '600', color: t.colors.ink2 }}>
          <Text color={t.colors.accent} weight="800" onPress={() => router.push('/(auth)/login')}>{tr('common.haveAccount')}</Text>
        </Text>
      </View>
    </Screen>
  );
}
