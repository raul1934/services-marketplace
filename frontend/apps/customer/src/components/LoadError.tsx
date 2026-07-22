import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Screen } from '@chamafacil/shared';

/**
 * What a screen shows when its query failed.
 *
 * The app already had the piece for this — `EmptyState` takes an icon, a title,
 * a body and an action, and has a `muted` tone for states that are not the
 * user's doing. Nothing was ever wired to it on the error path, so a failed
 * query looked like "nothing here" (a list) or like "still loading" (a detail
 * screen that waits for `!data`). Both are lies, and the second one never ends.
 *
 * This is the i18n wrapper: `packages/shared` renders strings, it does not
 * author them, so the copy lives here and the drawing lives there.
 */
export function LoadError({ onRetry, fill = true }: { onRetry?: () => void; fill?: boolean }) {
  const { t: tr } = useTranslation();
  return (
    <EmptyState
      icon="wifi"
      tone="muted"
      fill={fill}
      title={tr('common.loadErrorTitle')}
      body={tr('common.loadErrorBody')}
      action={onRetry ? { label: tr('common.retry'), onPress: onRetry } : undefined}
    />
  );
}

/** Full-screen variant, for screens whose whole content is the failed query. */
export function LoadErrorScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <Screen scroll={false}>
      <LoadError onRetry={onRetry} />
    </Screen>
  );
}
