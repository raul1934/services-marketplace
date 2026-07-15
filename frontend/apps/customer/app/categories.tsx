import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, CATEGORY_TYPE_ORDER, Card, Screen, SectionLabel, ServiceCategory, Skeleton, Text, useTheme } from '@chamafacil/shared';
import { useCategories } from '../src/queries';
import { CategoryIcon } from '../src/components/CategoryIcon';

export default function Categories() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { data, isLoading } = useCategories();

  const byType = (type: string): ServiceCategory[] => data?.filter((c) => c.type === type) ?? [];

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('categories.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 22 }}>
        {isLoading ? (
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
