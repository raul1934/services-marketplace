import React, { useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BackBar, Button, Field, Icon, Screen, SectionLabel, Segment, Text, useTheme } from '@walvee/shared';
import { useCreateAsset } from '../../src/queries';
import { setCreatedAsset } from '../../src/assetPick';
import { ASSET_FIELDS, ASSET_TYPES, AssetTypeKey } from '../../src/assetFields';
import { AssetDetailInput, GeoPoint } from '../../src/api';
import { AssetLocationField } from '../../src/components/AssetLocationField';
import { MakeModelPicker } from '../../src/components/MakeModelPicker';
import { PetSpeciesBreedPicker } from '../../src/components/PetSpeciesBreedPicker';
import { PropertyTypePicker } from '../../src/components/PropertyTypePicker';
import { DatePicker } from '../../src/components/DatePicker';
import { PickedPhoto, uploadPhotos, pickPhotos } from '../../src/photos';

/** AddAssetScreen (C23): register a new asset (free nickname + typed detail). */
export default function AddAsset() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const create = useCreateAsset();
  const { pick: pickMode, type: typeParam } = useLocalSearchParams<{ pick?: string; type?: string }>();
  const picking = !!pickMode;

  const [type, setType] = useState<AssetTypeKey>(
    ASSET_TYPES.includes(typeParam as AssetTypeKey) ? (typeParam as AssetTypeKey) : 'vehicle',
  );
  const [nickname, setNickname] = useState('');
  const [detail, setDetail] = useState<AssetDetailInput>({});
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);

  const set = (k: string, v: string | number | null) => setDetail((s) => ({ ...s, [k]: v }));

  const pick = async () => {
    try {
      const [p] = await pickPhotos(1);
      if (p) setPhoto(p);
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  const submit = async () => {
    if (nickname.trim().length < 2) return Alert.alert(tr('common.error'), tr('assets.nicknameError'));
    // Upload-first: upload the photo (if any), then create with its media id.
    let photoMediaId: number | undefined;
    if (photo) {
      try {
        const [m] = await uploadPhotos([photo]);
        photoMediaId = m?.id;
      } catch {
        /* non-fatal — create the asset without the photo */
      }
    }
    create.mutate(
      { type, nickname: nickname.trim(), detail, photo_media_id: photoMediaId },
      {
        onSuccess: (a) => {
          if (picking) {
            // Opened from a flow that wants to pick the new asset: hand the id
            // back and return, instead of navigating into the asset detail.
            setCreatedAsset(a.id);
            router.back();
          } else {
            router.replace(`/assets/${a.id}`);
          }
        },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );
  };

  return (
    <Screen stickyHeader padded={false}>
      <BackBar title={tr('assets.addTitle')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/assets'))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        {!picking && (
          <>
            <SectionLabel>{tr('assets.typeLabel')}</SectionLabel>
            <Segment items={ASSET_TYPES.map((k) => ({ value: k, label: tr(`assets.type.${k}`) }))} value={type} onChange={(v) => { setType(v as AssetTypeKey); setDetail({}); }} />
          </>
        )}

        <Pressable onPress={pick} style={{ alignSelf: 'center', alignItems: 'center', gap: 6 }}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={{ width: 96, height: 96, borderRadius: 18 }} />
          ) : (
            <View style={{ width: 96, height: 96, borderRadius: 18, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={28} color={t.colors.accent} />
            </View>
          )}
          <Text variant="caption" color={t.colors.accent}>{photo ? tr('assets.changePhoto') : tr('assets.addPhoto')}</Text>
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

        {ASSET_FIELDS[type].map((f) =>
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

        {type === 'vehicle' ? (
          <Field
            label={tr('assets.mileage')}
            value={(detail.mileage as string) ?? ''}
            onChangeText={(v) => set('mileage', v.replace(/\D/g, ''))}
            placeholder={tr('assets.kmPlaceholder')}
            keyboardType="numeric"
          />
        ) : null}

        <Button title={tr('assets.save')} full loading={create.isPending} onPress={submit} style={{ marginTop: 4 }} />
      </View>
    </Screen>
  );
}
