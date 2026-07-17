import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Icon, Row, SectionLabel, SkeletonTiles, Text, flattenPages, useTheme } from '@chamafacil/shared';
import { Asset } from '../api';
import { useAssets } from '../queries';
import { ICON, assetCaption } from '../assetDisplay';
import { FirstAssetTutorial } from './FirstAssetTutorial';

/** Marks the full-screen tutorial as seen, so it opens once and not every visit. */
const TUTORIAL_KEY = 'chamafacil.firstAsset.seen';

/** Tile width — wide enough for a two-word nickname without wrapping. */
const TILE_W = 150;

/**
 * What identifies an asset at a glance. For a property that's the street
 * address, not its type: the nickname already says "Casa principal", so
 * repeating "Casa" below it tells you nothing, while the address distinguishes
 * two houses. Falls back to the shared caption for vehicles and pets.
 */
function tileCaption(a: Asset, tr: (key: string) => string): string {
  if (a.type === 'property' && a.detail?.address) return a.detail.address;
  return assetCaption(a, tr);
}

/**
 * The client's assets, at the top of the home. This is the app's centre of
 * gravity: a request is always *about* something, and the asset is where the
 * measurements and history live. The home shows the first page only — the rail
 * is a shortcut, not the inventory ("/assets" is).
 */
export function HomeAssets() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const query = useAssets();
  const assets = flattenPages(query.data?.pages);

  if (query.isLoading) {
    return (
      <>
        <SectionLabel>{tr('home.assets')}</SectionLabel>
        <SkeletonTiles count={3} />
      </>
    );
  }

  // No assets means nothing to show *and* nothing the rest of the app can act
  // on, so the empty state is the loudest thing on the screen rather than a
  // muted placeholder — the full-screen tutorial on first sight, the card after.
  if (assets.length === 0) return <FirstAssetEmpty />;

  return (
    <>
      <Row>
        <SectionLabel style={{ flex: 1 }}>{tr('home.assets')}</SectionLabel>
        <Pressable onPress={() => router.push('/assets')} hitSlop={8}>
          <Text weight="700" color={t.colors.accent} style={{ fontSize: 13 }}>
            {tr('home.assetsAll')}
          </Text>
        </Pressable>
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
        {assets.map((a) => (
          <AssetTile key={a.id} asset={a} onPress={() => router.push(`/assets/${a.id}`)} />
        ))}
        <Pressable
          onPress={() => router.push('/assets/new')}
          accessibilityLabel={tr('assets.add')}
          style={{
            width: TILE_W,
            borderRadius: t.radius.card,
            borderWidth: 1.5,
            borderColor: t.colors.line,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 18,
          }}
        >
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={20} color={t.colors.accent} />
          </View>
          <Text weight="700" color={t.colors.ink3} style={{ fontSize: 12.5 }}>
            {tr('home.assetsAdd')}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function AssetTile({ asset, onPress }: { asset: Asset; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Card style={{ width: TILE_W }} onPress={onPress}>
      {asset.photo_url ? (
        <Image source={{ uri: asset.photo_url }} style={{ width: 44, height: 44, borderRadius: 13 }} />
      ) : (
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={ICON[asset.type] ?? 'home'} size={22} color={t.colors.accent} />
        </View>
      )}
      <Text weight="800" style={{ fontSize: 14, marginTop: 10 }} numberOfLines={1}>
        {asset.nickname}
      </Text>
      <Text variant="caption" numberOfLines={1}>
        {assetCaption(asset, tr)}
      </Text>
    </Card>
  );
}

/**
 * The no-assets state. Opens the full-screen tutorial the first time — there's
 * nothing on the home to interrupt anyway — and leaves the card behind once
 * it's been seen or skipped, so the invitation stays without nagging.
 */
function FirstAssetEmpty() {
  const [tutorial, setTutorial] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(TUTORIAL_KEY)
      .then((v) => setTutorial(v !== '1'))
      // Fail open: a storage error shouldn't cost someone the onboarding.
      .catch(() => setTutorial(true));
  }, []);

  const dismiss = () => {
    setTutorial(false);
    SecureStore.setItemAsync(TUTORIAL_KEY, '1').catch(() => {});
  };

  return (
    <>
      <FirstAssetCard />
      {tutorial ? <FirstAssetTutorial onDone={dismiss} /> : null}
    </>
  );
}

/** The quieter, persistent invitation that lives on the home. */
function FirstAssetCard() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  return (
    <Pressable onPress={() => router.push('/assets/new')}>
      <LinearGradient
        colors={t.grad as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: t.radius.card, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <View style={{ flex: 1 }}>
          <Text weight="800" color="#fff" style={{ fontSize: 17 }}>
            {tr('home.firstAssetTitle')}
          </Text>
          <Text color="rgba(255,255,255,0.9)" style={{ fontSize: 13, marginTop: 2 }}>
            {tr('home.firstAssetBody')}
          </Text>
        </View>
        <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="home" size={24} color="#fff" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
