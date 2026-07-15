import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Field, Icon, Row, SectionLabel, Text, useTheme } from '@chamafacil/shared';
import { AssetPart } from '../api';
import { useAddPart, useAssetParts, useRemovePart } from '../queries';

/**
 * "Cômodos e áreas" section for a property asset: name the parts (pool, hallway,
 * living room…), measure each in AR, and see the totals. Parts and their AR
 * measurements are persisted on the backend (see AssetController::parts).
 */
export function AssetParts({ assetId }: { assetId: number }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { data: parts = [] } = useAssetParts(assetId);
  const addPart = useAddPart(assetId);
  const removePart = useRemovePart(assetId);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const add = () => {
    const n = name.trim();
    if (!n) return;
    addPart.mutate(n, {
      onSuccess: () => {
        setName('');
        setAdding(false);
      },
      onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
    });
  };

  const confirmRemove = (p: AssetPart) =>
    Alert.alert(tr('assets.parts.removeTitle'), tr('assets.parts.removeBody', { name: p.name }), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('assets.parts.remove'), style: 'destructive', onPress: () => removePart.mutate(p.id) },
    ]);

  const measure = (p: AssetPart) =>
    router.push({ pathname: '/ar-medicao', params: { assetId: String(assetId), partId: String(p.id), partName: p.name } });

  const total = parts.reduce((sum, p) => sum + (p.area ?? 0), 0);

  return (
    <View style={{ gap: 10 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <SectionLabel>{tr('assets.parts.title')}</SectionLabel>
        {total > 0 ? (
          <Text variant="caption" color={t.colors.accent}>
            {tr('assets.parts.total', { value: total.toFixed(2) })}
          </Text>
        ) : null}
      </Row>

      {parts.length === 0 && !adding ? <Text variant="caption">{tr('assets.parts.empty')}</Text> : null}

      {parts.map((p) => {
        const measured = p.points_count != null && p.points_count > 0;
        const summary = measured
          ? p.points_count! >= 3
            ? tr('assets.parts.summaryArea', { area: (p.area ?? 0).toFixed(2), perimeter: (p.perimeter ?? 0).toFixed(2) })
            : tr('assets.parts.summaryDist', { perimeter: (p.perimeter ?? 0).toFixed(2) })
          : tr('assets.parts.unmeasured');
        return (
          <Card key={p.id} style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text weight="800" style={{ fontSize: 15 }}>{p.name}</Text>
                <Text variant="caption" color={measured ? t.colors.ink2 : t.colors.ink3}>{summary}</Text>
              </View>
              <Row gap={8}>
                <Pressable
                  onPress={() => measure(p)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.colors.accentSoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}
                >
                  <Icon name="camera" size={15} color={t.colors.accent} />
                  <Text variant="label" color={t.colors.accent}>
                    {measured ? tr('assets.parts.remeasure') : tr('assets.parts.measure')}
                  </Text>
                </Pressable>
                <Pressable onPress={() => confirmRemove(p)} hitSlop={8} accessibilityRole="button">
                  <Icon name="close" size={18} color={t.colors.ink3} />
                </Pressable>
              </Row>
            </Row>
          </Card>
        );
      })}

      {adding ? (
        <Card style={{ gap: 10 }}>
          <Field
            label={tr('assets.parts.nameLabel')}
            value={name}
            onChangeText={setName}
            placeholder={tr('assets.parts.namePlaceholder')}
            autoFocus
            onSubmitEditing={add}
          />
          <Row gap={10}>
            <Button title={tr('common.cancel')} variant="ghost" onPress={() => { setAdding(false); setName(''); }} style={{ flex: 1 }} />
            <Button title={tr('assets.parts.add')} onPress={add} loading={addPart.isPending} disabled={!name.trim()} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.line }}
        >
          <Icon name="plus" size={16} color={t.colors.accent} />
          <Text variant="label" color={t.colors.accent}>{tr('assets.parts.addPart')}</Text>
        </Pressable>
      )}
    </View>
  );
}
