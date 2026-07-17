import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Chip, Field, Icon, Row, SectionLabel, Text, useTheme } from '@chamafacil/shared';
import { AssetPart } from '../api';
import { useAddPart, useAddParts, useAssetParts, usePropertyTypes, useRemovePart } from '../queries';

/**
 * "Cômodos e áreas" section for a property asset: name the parts (pool, hallway,
 * living room…), measure each in AR, and see the totals. Parts and their AR
 * measurements are persisted on the backend (see AssetController::parts).
 *
 * The parts a property type usually has arrive nested in `usePropertyTypes()`
 * (cached for a day), so the chips cost no request. They **suggest**: the free
 * text field below them still names anything, and `asset_parts.name` stays a
 * plain string.
 *
 * Why pre-ticking is honest: a part is an empty slot to measure (`area` null →
 * "Sem medição"). We pre-select a *choice*, never invent a *fact* — nothing here
 * ever fills in a size nobody measured.
 */
export function AssetParts({ assetId, propertyTypeId }: { assetId: number; propertyTypeId?: number | null }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { data: parts = [] } = useAssetParts(assetId);
  const { data: types = [] } = usePropertyTypes(!!propertyTypeId);
  const addPart = useAddPart(assetId);
  const addParts = useAddParts(assetId);
  const removePart = useRemovePart(assetId);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);

  const suggestions = useMemo(
    () => (propertyTypeId ? types.find((x) => x.id === propertyTypeId)?.part_types ?? [] : []),
    [types, propertyTypeId],
  );

  // Don't suggest what the property already has, however it got named.
  const offered = useMemo(() => {
    const have = new Set(parts.map((p) => p.name.trim().toLowerCase()));
    return suggestions.filter((s) => !have.has(s.name.toLowerCase()));
  }, [suggestions, parts]);

  // Seed the ticks from the catalog once, on the first load for this type —
  // after that the ticks are the user's, and re-seeding would undo their taps.
  const seeded = useRef<number | null>(null);
  useEffect(() => {
    if (!propertyTypeId || !suggestions.length || seeded.current === propertyTypeId) return;
    seeded.current = propertyTypeId;
    setPicked(suggestions.filter((s) => s.default_selected).map((s) => s.slug));
  }, [propertyTypeId, suggestions]);

  const toggle = (slug: string) =>
    setPicked((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const chosen = offered.filter((s) => picked.includes(s.slug));

  const addChosen = () => {
    if (!chosen.length) return;
    addParts.mutate(
      chosen.map((s) => s.name),
      {
        onSuccess: () => setPicked((prev) => prev.filter((s) => !chosen.some((c) => c.slug === s))),
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );
  };

  const add = () => {
    const n = name.trim();
    if (!n) return;
    addPart.mutate(n, {
      // Keep the field open and focused: naming three rooms shouldn't mean
      // reopening the form three times.
      onSuccess: () => setName(''),
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

      {parts.length === 0 && !adding && !offered.length ? (
        <Text variant="caption">{tr('assets.parts.empty')}</Text>
      ) : null}

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

      {/* Suggestion chips: one tap each, the usual ones already ticked. */}
      {offered.length ? (
        <Card style={{ gap: 10 }}>
          <Row gap={6} style={{ alignItems: 'flex-start' }}>
            <Icon name="sparkles" size={14} color={t.colors.ink3} />
            <Text variant="caption" color={t.colors.ink3} style={{ flex: 1 }}>
              {tr('assets.parts.suggestHint')}
            </Text>
          </Row>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {offered.map((s) => (
              <Chip key={s.slug} label={s.name} active={picked.includes(s.slug)} onPress={() => toggle(s.slug)} />
            ))}
          </View>
          <Button
            // i18n runs compatibilityJSON v3 (no Intl.PluralRules under Hermes),
            // whose only plural suffix is `_plural` — zero has to be its own key.
            title={chosen.length ? tr('assets.parts.addChosen', { count: chosen.length }) : tr('assets.parts.addNone')}
            onPress={addChosen}
            loading={addParts.isPending}
            disabled={!chosen.length}
          />
        </Card>
      ) : null}

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
            <Button title={tr('common.close')} variant="ghost" onPress={() => { setAdding(false); setName(''); }} style={{ flex: 1 }} />
            <Button title={tr('assets.parts.add')} onPress={add} loading={addPart.isPending} disabled={!name.trim()} style={{ flex: 1 }} />
          </Row>
        </Card>
      ) : (
        <Pressable
          onPress={() => setAdding(true)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: t.colors.line }}
        >
          <Icon name="plus" size={16} color={t.colors.accent} />
          {/* The escape hatch: the catalog suggests, it never restricts. */}
          <Text variant="label" color={t.colors.accent}>
            {tr(offered.length ? 'assets.parts.addOther' : 'assets.parts.addPart')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
