import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, CATEGORY_TYPE_ORDER, Card, EmptyState, Field, Screen, SectionLabel, ServiceCategory, Skeleton, Text, useTheme } from '@chamafacil/shared';
import { useCategories } from '../src/queries';
import { CategoryIcon } from '../src/components/CategoryIcon';
import { LoadError } from '../src/components/LoadError';

export default function Categories() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { data, isLoading, isError, refetch } = useCategories();

  // Someone who already knows what they need was scrolling past every other
  // section to find it. Matching on the translated name as well as the raw
  // one, because the list the user is reading is the translated one.
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = (c: ServiceCategory) =>
    !q ||
    tr(`categories.${c.slug}`, { defaultValue: c.name }).toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q);

  const byType = (type: string): ServiceCategory[] =>
    data?.filter((c) => c.type === type).filter(matches) ?? [];
  const nothingFound = !!q && !!data && !data.some(matches);

  return (
    <Screen stickyHeader padded={false}>
      <BackBar backLabel={tr('common.back')} title={tr('categories.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 22 }}>
        {data && data.length > 0 ? (
          <Field
            value={query}
            onChangeText={setQuery}
            label={tr('categories.searchLabel')}
            placeholder={tr('categories.searchPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : null}
        {/* A failed catalog used to render nothing at all: `data` stayed
            undefined, every `byType` came back empty, and the screen was a
            back bar over blank space with no hint that anything had gone
            wrong or anything to press. */}
        {nothingFound ? (
          <EmptyState
            icon="search"
            tone="muted"
            title={tr('categories.noResultsTitle')}
            body={tr('categories.noResultsBody', { query: query.trim() })}
          />
        ) : isError && !data ? (
          <LoadError onRetry={refetch} fill={false} />
        ) : isLoading ? (
          <View style={{ gap: 22 }}>
            {[0, 1].map((s) => (
              <View key={s} style={{ gap: 14 }}>
                <Skeleton width="42%" height={13} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} width="31%" height={92} radius={16} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ) : (
          CATEGORY_TYPE_ORDER.map((type) => {
            const items = byType(type);
            if (!items.length) return null;
            return (
              <View key={type} style={{ gap: 14 }}>
                <SectionLabel>{tr(`enums.categoryType.${type}`)}</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {items.map((c) => (
                    <Card
                      key={c.id}
                      flat
                      onPress={() => router.push({ pathname: '/request/new', params: { categoryId: c.id } })}
                      padded={false}
                      style={{ width: '31%', paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 9 }}
                    >
                      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <CategoryIcon category={c} size={24} />
                      </View>
                      <Text center weight="700" style={{ fontSize: 12.5, lineHeight: 14 }} numberOfLines={2}>
                        {tr(`categories.${c.slug}`, { defaultValue: c.name })}
                      </Text>
                    </Card>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </View>
    </Screen>
  );
}
