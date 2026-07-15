import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { SkeletonScreen, Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Button, Field, Icon, NotFoundView, Screen, SectionLabel, Text, useTheme } from '@chamafacil/shared';
import { useArchiveAsset, useAsset, useUpdateAsset } from '../../../src/queries';
import { ASSET_FIELDS, AssetTypeKey } from '../../../src/assetFields';
import { AssetDetailInput, GeoPoint } from '../../../src/api';
import { AssetLocationField } from '../../../src/components/AssetLocationField';
import { MakeModelPicker } from '../../../src/components/MakeModelPicker';
import { PetSpeciesBreedPicker } from '../../../src/components/PetSpeciesBreedPicker';
import { PropertyTypePicker } from '../../../src/components/PropertyTypePicker';
import { DatePicker } from '../../../src/components/DatePicker';
import { pickPhotos, uploadPhotos } from '../../../src/photos';

/** EditAssetScreen (C24): rename / fix catalog data / change photo / archive. */
export default function EditAsset() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const assetId = Number(id);
  const { data: asset, isLoading } = useAsset(assetId);
  const update = useUpdateAsset(assetId);
  const archive = useArchiveAsset();

  const [nickname, setNickname] = useState('');
  const [detail, setDetail] = useState<AssetDetailInput>({});
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (asset) {
      setNickname(asset.nickname);
      setDetail({ ...(asset.detail ?? {}) });
    }
  }, [asset]);

  if (isLoading) return <SkeletonScreen />;
  if (!asset) {
    return (
      <NotFoundView
        showBackBar
        icon="car"
        title={tr('notFound.asset.title')}
        body={tr('notFound.asset.body')}
        homeLabel={tr('notFound.home')}
        onHome={() => router.replace('/assets')}
        backLabel={tr('common.back')}
        onBack={router.canGoBack() ? () => router.back() : undefined}
      />
    );
  }

  const type = asset.type as AssetTypeKey;
  const fields = ASSET_FIELDS[type] ?? [];
  const set = (k: string, v: string | number | null) => setDetail((s) => ({ ...s, [k]: v }));

  const changePhoto = async () => {
    try {
      const [photo] = await pickPhotos(1);
      if (!photo) return;
      setPhotoBusy(true);
      const [m] = await uploadPhotos([photo]); // upload-first
      if (m) await update.mutateAsync({ photo_media_id: m.id });
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const save = () =>
    update.mutate(
      { nickname: nickname.trim(), detail },
      {
        onSuccess: () => { Alert.alert(tr('common.saved'), tr('assets.savedBody')); router.back(); },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );

  const confirmArchive = () =>
    Alert.alert(tr('assets.archiveTitle'), tr('assets.archiveBody'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('assets.archive'),
        style: 'destructive',
        onPress: () => archive.mutate(assetId, { onSuccess: () => router.replace('/assets') }),
      },
    ]);

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('assets.editTitle')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/assets/${assetId}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        <Pressable onPress={changePhoto} style={{ alignSelf: 'center', alignItems: 'center', gap: 6 }}>
          {asset.photo_url ? (
            <Image source={{ uri: asset.photo_url }} style={{ width: 96, height: 96, borderRadius: 18 }} />
          ) : (
            <View style={{ width: 96, height: 96, borderRadius: 18, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={28} color={t.colors.accent} />
            </View>
          )}
          <Text variant="caption" color={t.colors.accent}>
            {photoBusy ? '…' : asset.photo_url ? tr('assets.changePhoto') : tr('assets.addPhoto')}
          </Text>
        </Pressable>

        <Field label={tr('assets.nickname')} value={nickname} onChangeText={setNickname} placeholder={tr('assets.nicknamePlaceholder')} />

        <SectionLabel>{tr('assets.detailsLabel')}</SectionLabel>

        {type === 'vehicle' ? (
          <MakeModelPicker
            makeId={(detail.vehicle_make_id as number) ?? null}
            modelId={(detail.vehicle_model_id as number) ?? null}
            onChange={(v) => setDetail((s) => ({ ...s, ...v }))}
          />
        ) : null}
        {type === 'pet' ? (
          <PetSpeciesBreedPicker
            speciesId={(detail.pet_species_id as number) ?? null}
            breedId={(detail.pet_breed_id as number) ?? null}
            onChange={(v) => setDetail((s) => ({ ...s, ...v }))}
          />
        ) : null}
        {type === 'property' ? (
          <PropertyTypePicker
            value={(detail.property_type_id as number) ?? null}
            onChange={(id) => setDetail((s) => ({ ...s, property_type_id: id }))}
          />
        ) : null}

        {fields.map((f) =>
          f.key === 'birthdate' ? (
            <DatePicker
              key={f.key}
              label={tr(`assets.fields.${f.key}`)}
              value={(detail[f.key] as string) ?? ''}
              onChange={(v) => set(f.key, v)}
              placeholder={tr('assets.datePlaceholder')}
              disableFuture
            />
          ) : (
            <Field
              key={f.key}
              label={tr(`assets.fields.${f.key}`)}
              value={(detail[f.key] as string) ?? ''}
              onChangeText={(v) => set(f.key, v)}
              placeholder={f.placeholder}
              keyboardType={f.keyboardType}
              autoCapitalize={f.key === 'plate' ? 'characters' : 'sentences'}
            />
          ),
        )}

        {type === 'property' ? (
          <>
            <SectionLabel>{tr('assets.locationLabel')}</SectionLabel>
            <AssetLocationField
              latitude={detail.latitude as number | undefined}
              longitude={detail.longitude as number | undefined}
              geofence={(detail.geofence as GeoPoint[] | undefined) ?? null}
              onChange={(patch) => setDetail((s) => ({ ...s, ...patch }))}
            />
          </>
        ) : null}

        <Button title={tr('assets.save')} full loading={update.isPending} onPress={save} style={{ marginTop: 4 }} />
        <Button title={tr('assets.archive')} variant="ghost" full onPress={confirmArchive} />
        <Text variant="caption" center>{tr('assets.archiveHint')}</Text>
      </View>
    </Screen>
  );
}
