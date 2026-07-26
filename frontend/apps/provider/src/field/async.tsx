/**
 * Small async helpers for the field screens: a fetch hook with loading/error/
 * reload, plus centered Loading and Error views (the error offers a retry and
 * shows the API's localized message).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { ApiError, Text, useTheme } from '@chamafacil/shared';
import { useTranslation } from 'react-i18next';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fn().then(
      (d) => alive && (setData(d), setLoading(false)),
      (e) => alive && (setError(e as Error), setLoading(false)),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, reload, setData };
}

export function Loading() {
  const t = useTheme();
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={t.colors.accent} />
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const message = error instanceof ApiError ? error.message : tr('field.loadError');
  return (
    <View style={{ paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center', gap: 12 }}>
      <Text variant="caption" style={{ textAlign: 'center' }}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={{ backgroundColor: t.colors.accentSoft, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 }}
      >
        <Text weight="700" style={{ fontSize: 13 }} color={t.colors.accent}>{tr('field.retry')}</Text>
      </Pressable>
    </View>
  );
}
