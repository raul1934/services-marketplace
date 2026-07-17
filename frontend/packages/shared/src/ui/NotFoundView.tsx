import React from 'react';
import { View } from 'react-native';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { IconName } from './Icon';
import { BackBar } from './primitives';
import { Screen } from './Screen';

/**
 * Branded "not found" screen — used both for unmatched routes (`+not-found`) and
 * for resource-404s in by-id detail screens. Presentational only: it takes
 * `onHome`/`onBack` callbacks (no router dependency) so both apps reuse it, and
 * composes the existing `Screen` + `EmptyState` + `Button`.
 */
export function NotFoundView({
  title,
  body,
  icon = 'search',
  homeLabel,
  onHome,
  backLabel,
  onBack,
  showBackBar = false,
  backBarTitle,
}: {
  title: string;
  body?: string;
  icon?: IconName;
  homeLabel: string;
  onHome: () => void;
  backLabel?: string;
  onBack?: () => void;
  /** Render a BackBar header above the body (uses `onBack`). */
  showBackBar?: boolean;
  backBarTitle?: string;
}) {
  return (
    <Screen stickyHeader={showBackBar} scroll={false} padded={false}>
      {showBackBar && onBack ? <BackBar title={backBarTitle ?? title} onBack={onBack} /> : null}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 18 }}>
        <EmptyState icon={icon} title={title} body={body} />
        <View style={{ gap: 10 }}>
          <Button title={homeLabel} variant="grad" full onPress={onHome} />
          {onBack && backLabel ? <Button title={backLabel} variant="ghost" full onPress={onBack} /> : null}
        </View>
      </View>
    </Screen>
  );
}
