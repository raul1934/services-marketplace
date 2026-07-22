import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Button, Card, Chip, EmptyState, Icon, PaginatedList, Row, Text, useTheme } from '@chamafacil/shared';
import { Asset } from '../../src/api';
import { useAssets } from '../../src/queries';
import { ASSET_TYPES, AssetTypeKey } from '../../src/assetFields';
import { ICON, assetCaption } from '../../src/assetDisplay';
import { LoadError } from '../../src/components/LoadError';

type Filter = 'all' | AssetTypeKey;

/** Meus ativos (C22): the client's registered assets, with type filter + add/edit. */
export default function AssetsScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');
  const query = useAssets(filter === 'all' ? undefined : filter);

  const caption = (a: Asset) => assetCaption(a, tr);

  return (
    <PaginatedList<Asset>
      query={query}
      padded={false}
      keyExtractor={(a) => String(a.id)}
      header={
        <View>
          <BackBar backLabel={tr('common.back')}
            title={tr('assets.title')}
            onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 12 }}
          >
            <Chip label={tr('common.all')} active={filter === 'all'} onPress={() => setFilter('all')} />
            {ASSET_TYPES.map((k) => (
              <Chip key={k} label={tr(`assets.type.${k}`)} active={filter === k} onPress={() => setFilter(k)} />
            ))}
          </ScrollView>
        </View>
      }
      contentContainerStyle={{ paddingHorizontal: 20 }}
      empty={<EmptyState fill icon="car" title={tr('assets.emptyTitle')} body={tr('assets.emptyBody')} />}
      errorState={<LoadError onRetry={query.refetch} />}
      footer={
        <Button
          title={tr('assets.add')}
          variant="soft"
          full
          onPress={() => router.push('/assets/new')}
          left={<Icon name="plus" size={16} color={t.colors.accent} />}
        />
      }
      renderItem={(a) => (
        <Card onPress={() => router.push(`/assets/${a.id}`)}>
          <Row gap={12}>
            {a.photo_url ? (
              <Image source={{ uri: a.photo_url }} style={{ width: 48, height: 48, borderRadius: 14 }} />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                {a.detail?.make_logo_url ? (
                  <Image source={{ uri: a.detail.make_logo_url }} style={{ width: 34, height: 34 }} resizeMode="contain" />
                ) : (
                  <Icon name={ICON[a.type] ?? 'car'} size={24} color={t.colors.accent} />
                )}
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text weight="800" style={{ fontSize: 15 }}>{a.nickname}</Text>
              <Text variant="caption" numberOfLines={1}>{caption(a)}</Text>
            </View>
            <Icon name="arrowR" size={18} color={t.colors.ink3} />
          </Row>
        </Card>
      )}
    />
  );
}
