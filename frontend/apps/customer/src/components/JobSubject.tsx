import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Asset,
  Card,
  Icon,
  IconName,
  RequestPhoto,
  Row,
  Text,
  useTheme,
} from '@chamafacil/shared';

const ASSET_ICON: Record<string, IconName> = { vehicle: 'car', property: 'home', pet: 'paw' };

/** Thumbnails past this collapse into a "+N" chip. */
const VISIBLE_THUMBS = 3;

/**
 * What the job is about: the asset and the photos the client sent when asking.
 *
 * Pinned on the tracking screen rather than living inside the "Solicitação"
 * tab. Mid-job the two recurring questions are "is this the right car?" and
 * "did I show him the right thing?", and having to leave the tab you're
 * watching to answer either of them is the wrong trade. The client's own photos
 * had no home on this screen at all before — they were uploaded at request time
 * and never shown again.
 *
 * Deliberately one row: it shares a pinned header with the back bar and the
 * progress stepper, so it earns its place by staying small.
 */
export function JobSubject({
  asset,
  photos,
  onPressAsset,
}: {
  asset?: Asset | null;
  photos?: RequestPhoto[];
  onPressAsset?: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { width, height } = useWindowDimensions();
  const [viewing, setViewing] = useState<string | null>(null);

  const shots = photos ?? [];

  // Nothing to say — a request without an asset or photos (beauty services, a
  // bare description) shouldn't leave an empty band under the header.
  if (!asset && shots.length === 0) return null;

  const d = asset?.detail ?? {};
  const caption =
    [d.make, d.model, d.plate, d.kind, d.unit, d.species, d.breed].filter(Boolean).join(' · ') ||
    (asset ? tr(`assets.type.${asset.type}`) : '');

  const visible = shots.slice(0, VISIBLE_THUMBS);
  const hidden = shots.length - visible.length;

  return (
    <>
      <Card flat style={{ paddingVertical: 10, paddingHorizontal: 12, marginHorizontal: 20, marginBottom: 12 }}>
        <Row gap={10}>
          {asset && (
            <Pressable onPress={onPressAsset} disabled={!onPressAsset} style={{ flex: 1 }}>
              <Row gap={10}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: t.colors.accentSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {d.make_logo_url ? (
                    <Image source={{ uri: d.make_logo_url }} style={{ width: 26, height: 26 }} resizeMode="contain" />
                  ) : (
                    <Icon name={ASSET_ICON[asset.type] ?? 'car'} size={19} color={t.colors.accent} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="800" style={{ fontSize: 14 }} numberOfLines={1}>
                    {asset.nickname}
                  </Text>
                  {!!caption && (
                    <Text variant="caption" numberOfLines={1}>
                      {caption}
                    </Text>
                  )}
                </View>
              </Row>
            </Pressable>
          )}

          {shots.length > 0 && (
            <Row gap={6}>
              {visible.map((p) => (
                <Pressable key={p.id} onPress={() => setViewing(p.url)}>
                  <Image source={{ uri: p.url }} style={{ width: 38, height: 38, borderRadius: 9 }} />
                </Pressable>
              ))}
              {hidden > 0 && (
                <Pressable
                  onPress={() => setViewing(shots[VISIBLE_THUMBS].url)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    backgroundColor: t.colors.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text weight="800" style={{ fontSize: 12 }} color={t.colors.ink2}>
                    +{hidden}
                  </Text>
                </Pressable>
              )}
            </Row>
          )}
        </Row>
      </Card>

      {/* A 38px thumbnail can't settle "is that the right dent" — tapping opens
          the full frame. Tap anywhere to dismiss. */}
      <Modal visible={viewing !== null} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable
          onPress={() => setViewing(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' }}
        >
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {shots.map((p) => (
              <Image
                key={p.id}
                source={{ uri: p.url }}
                style={{ width, height: height * 0.7 }}
                resizeMode="contain"
              />
            ))}
          </ScrollView>
        </Pressable>
      </Modal>
    </>
  );
}
