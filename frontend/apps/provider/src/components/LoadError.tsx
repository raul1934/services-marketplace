import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@chamafacil/shared';

/**
 * What a list shows when its query failed, instead of claiming it is empty.
 * The i18n wrapper for `EmptyState`: shared renders strings, it does not
 * author them. Mirrors the customer app's component of the same name.
 */
export function LoadError({ onRetry }: { onRetry?: () => void }) {
  const { t: tr } = useTranslation();
  return (
    <EmptyState
      icon="wifi"
      tone="muted"
      fill
      title={tr('common.loadErrorTitle')}
      body={tr('common.loadErrorBody')}
      action={onRetry ? { label: tr('common.retry'), onPress: onRetry } : undefined}
    />
  );
}
