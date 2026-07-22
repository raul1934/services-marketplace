import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Icon, Row, SectionLabel, SkeletonList, Text, useTheme } from '@chamafacil/shared';
import { Asset } from '../api';
import { ICON, assetCaption } from '../assetDisplay';

/**
 * Pick-an-existing-asset-or-add-one control used inside the new-request wizard.
 * Presentational: receives the already type-filtered asset list + callbacks; the
 * caller owns data fetching and the "add new" navigation/round-trip.
 */
export function AssetSelector({
  assetType,
  assets,
  selectedId,
  onSelect,
  onAddNew,
  loading,
  note,
}: {
  assetType: 'vehicle' | 'property' | 'pet';
  assets: Asset[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAddNew: () => void;
  loading?: boolean;
  /** Explains a selection the app made for you. Shown under the list. */
  note?: string;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();

  return (
    <View style={{ gap: 10 }}>
      <SectionLabel>{tr('createRequest.yourAsset')}</SectionLabel>

      {loading && assets.length === 0 ? (
        <SkeletonList count={2} padded={false} />
      ) : (
        assets.map((a) => {
          const on = selectedId === a.id;
          return (
            <Card
              key={a.id}
              flat
              onPress={() => onSelect(a.id)}
              // Which one is chosen was said only by an accent border and a check
              // glyph - both invisible to a screen reader, which read every card
              // identically and gave no way to tell the picked one apart.
              accessibilityState={{ selected: on }}
              style={{ borderWidth: 1.5, borderColor: on ? t.colors.accent : t.colors.line }}
            >
              <Row gap={12}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  {a.detail?.make_logo_url ? (
                    <Image source={{ uri: a.detail.make_logo_url }} style={{ width: 32, height: 32 }} resizeMode="contain" />
                  ) : (
                    <Icon name={ICON[a.type] ?? ICON[assetType] ?? 'car'} size={22} color={t.colors.accent} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="800" style={{ fontSize: 14.5 }}>{a.nickname}</Text>
                  <Text variant="caption" numberOfLines={1}>{assetCaption(a, tr)}</Text>
                </View>
                {on && <Icon name="check" size={18} color={t.colors.ok} />}
              </Row>
            </Card>
          );
        })
      )}

      {note ? (
        <Row gap={7}>
          <Icon name="check" size={14} color={t.colors.ok} />
          <Text variant="caption" color={t.colors.ink2} style={{ flex: 1 }}>
            {note}
          </Text>
        </Row>
      ) : null}

      <Button
        title={tr('createRequest.addAsset')}
        variant="soft"
        onPress={onAddNew}
        left={<Icon name="plus" size={16} color={t.colors.accent} />}
      />
    </View>
  );
}
