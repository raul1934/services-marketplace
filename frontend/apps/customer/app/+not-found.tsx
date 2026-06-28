import React from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { NotFoundView } from '@walvee/shared';

/** Catch-all for unmatched routes. */
export default function NotFound() {
  const router = useRouter();
  const { t: tr } = useTranslation();
  return (
    <NotFoundView
      icon="search"
      title={tr('notFound.route.title')}
      body={tr('notFound.route.body')}
      homeLabel={tr('notFound.home')}
      onHome={() => router.replace('/(tabs)/home')}
      backLabel={tr('common.back')}
      onBack={router.canGoBack() ? () => router.back() : undefined}
    />
  );
}
