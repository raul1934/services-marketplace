import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, BackBar, Button, Card, Chip, Icon, Screen, Text, useTheme } from '@chamafacil/shared';
import { useAddParts, usePropertyTypes } from '../../../src/queries';

/**
 * Guided first-property setup — the "offer the parts, measure the first" half of
 * onboarding (tasks 4.5 / 6.9). Reached once, right after the *first* property is
 * created (new.tsx routes here only when `guided=1`); every later property just
 * lands on its detail screen, whose AssetParts section already carries the same
 * chips. So this screen adds no new capability — it sequences the ones that exist
 * (catalog suggestions → batch add → AR) into a first-run path instead of leaving
 * a brand-new user to discover the chips on a detail screen they've never seen.
 *
 * Honest by construction: the chips add empty slots to measure (`area` null), and
 * the primary action hands off to AR for the first one. Nothing here fabricates a
 * measurement; "medir o primeiro" is an offer, and "Depois" is always one tap away.
 */
export default function AssetSetup() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id, propertyTypeId, nickname } = useLocalSearchParams<{ id: string; propertyTypeId?: string; nickname?: string }>();
  const assetId = Number(id);
  const typeId = propertyTypeId ? Number(propertyTypeId) : null;

  const { data: types = [] } = usePropertyTypes(!!typeId);
  const addParts = useAddParts(assetId);

  const suggestions = useMemo(
    () => (typeId ? types.find((x) => x.id === typeId)?.part_types ?? [] : []),
    [types, typeId],
  );

  const [picked, setPicked] = useState<string[]>([]);

  // Seed the ticks from the catalog once, when suggestions first arrive.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !suggestions.length) return;
    seeded.current = true;
    setPicked(suggestions.filter((s) => s.default_selected).map((s) => s.slug));
  }, [suggestions]);

  const toggle = (slug: string) =>
    setPicked((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const chosen = suggestions.filter((s) => picked.includes(s.slug));

  const goToDetail = () => router.replace(`/assets/${assetId}`);

  const addAndMeasure = () => {
    if (!chosen.length) return goToDetail();
    addParts.mutate(chosen.map((s) => s.name), {
      onSuccess: (parts) => {
        // Hand off to AR for the first room just added; the rest wait on the
        // detail screen. If the response is empty for any reason, don't strand
        // the user — fall back to the detail.
        const first = parts?.[0];
        if (first) {
          router.replace(`/assets/${assetId}`);
          router.push({ pathname: '/ar-medicao', params: { assetId: String(assetId), partId: String(first.id), partName: first.name } });
        } else {
          goToDetail();
        }
      },
      onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
    });
  };

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('assetSetup.title')} onBack={goToDetail} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16 }}>
        <Text weight="800" style={{ fontSize: 22, lineHeight: 28 }}>
          {nickname ? tr('assetSetup.headingNamed', { name: nickname }) : tr('assetSetup.heading')}
        </Text>
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
            <Icon name="sparkles" size={16} color={t.colors.ink3} />
            <Text variant="caption" color={t.colors.ink3} style={{ flex: 1 }}>
              {tr('assetSetup.hint')}
            </Text>
          </View>
          {suggestions.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map((s) => (
                <Chip key={s.slug} label={s.name} active={picked.includes(s.slug)} onPress={() => toggle(s.slug)} />
              ))}
            </View>
          ) : (
            <Text variant="caption" color={t.colors.ink3}>{tr('assetSetup.noneForType')}</Text>
          )}
        </Card>

        <Button
          title={chosen.length ? tr('assetSetup.addAndMeasure', { count: chosen.length }) : tr('assetSetup.skipToDetail')}
          full
          loading={addParts.isPending}
          onPress={addAndMeasure}
        />
        {chosen.length ? (
          <Button title={tr('assetSetup.later')} variant="ghost" full onPress={goToDetail} />
        ) : null}
      </View>
    </Screen>
  );
}
