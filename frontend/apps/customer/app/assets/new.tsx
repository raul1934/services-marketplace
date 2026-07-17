import React, { useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Field, Icon, IconName, SectionLabel, Text, Wiz, useTheme } from '@chamafacil/shared';
import { useCreateAsset } from '../../src/queries';
import { setCreatedAsset } from '../../src/assetPick';
import { ICON } from '../../src/assetDisplay';
import { ASSET_FIELDS, ASSET_TYPES, AssetTypeKey } from '../../src/assetFields';
import { AssetDetailInput, GeoPoint } from '../../src/api';
import { AssetLocationField } from '../../src/components/AssetLocationField';
import { MakeModelPicker } from '../../src/components/MakeModelPicker';
import { PetSpeciesBreedPicker } from '../../src/components/PetSpeciesBreedPicker';
import { PropertyTypePicker } from '../../src/components/PropertyTypePicker';
import { DatePicker } from '../../src/components/DatePicker';
import { PickedPhoto, uploadPhotos, pickPhotos } from '../../src/photos';

type StepKey = 'type' | 'details' | 'location' | 'identity';

/**
 * What each asset type unlocks — shown under the type cards so step 1 isn't a
 * choice on an empty screen but a preview of what registering gets you. The copy
 * lives in i18n (`assetWizard.type.benefits.<type>`); only the icons are here.
 */
const BENEFITS: Record<AssetTypeKey, IconName[]> = {
  vehicle: ['wrench', 'car', 'camera'],
  property: ['camera', 'wrench', 'home'],
  pet: ['heart', 'shield', 'camera'],
};

/**
 * AddAssetScreen (C23) as a stepper — same chrome as the request wizard (Wiz),
 * so registering an asset feels like the guided flow it feeds, not a long form.
 * Steps adapt to the type (only a property gets a location step) and to the entry
 * point (opened as a picker from the request flow, the type is fixed and its step
 * is dropped). The submit behaviour is unchanged from the old single-form screen:
 * picker → hand the id back; first-run property (`guided`) → the room setup;
 * otherwise → the asset detail.
 */
export default function AddAsset() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const create = useCreateAsset();
  const { pick: pickMode, type: typeParam, guided: guidedParam } = useLocalSearchParams<{ pick?: string; type?: string; guided?: string }>();
  const picking = !!pickMode;
  const guided = !!guidedParam;

  const [type, setType] = useState<AssetTypeKey>(
    ASSET_TYPES.includes(typeParam as AssetTypeKey) ? (typeParam as AssetTypeKey) : 'vehicle',
  );
  const [nickname, setNickname] = useState('');
  const [detail, setDetail] = useState<AssetDetailInput>({});
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [step, setStep] = useState(1); // 1-based

  const set = (k: string, v: string | number | null) => setDetail((s) => ({ ...s, [k]: v }));

  // Steps depend on the type (property adds a location step) and the entry point
  // (a picker fixes the type, so its step is dropped).
  const stepKeys = useMemo<StepKey[]>(() => {
    const middle: StepKey[] = type === 'property' ? ['details', 'location'] : ['details'];
    return picking ? [...middle, 'identity'] : ['type', ...middle, 'identity'];
  }, [type, picking]);

  const total = stepKeys.length;
  const clamped = Math.min(step, total);
  const stepKey = stepKeys[clamped - 1];
  const isLast = clamped === total;

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
          } else if (guided && type === 'property') {
            // First-run onboarding (4.5/6.9): continue into the guided room setup
            // instead of dropping onto the detail screen. Only for properties —
            // the setup offers rooms by property type.
            router.replace({
              pathname: `/assets/${a.id}/setup`,
              params: { propertyTypeId: String(detail.property_type_id ?? ''), nickname: nickname.trim() },
            });
          } else {
            router.replace(`/assets/${a.id}`);
          }
        },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );
  };

  // Only the name is required (as before); every other field is optional and can
  // be filled in later, so a step never traps you except the final save.
  const canContinue =
    stepKey === 'type' ||
    stepKey === 'details' ||
    stepKey === 'location' ||
    (stepKey === 'identity' && nickname.trim().length >= 2);

  const goBack = () => {
    if (clamped > 1) return setStep(clamped - 1);
    return router.canGoBack() ? router.back() : router.replace('/assets');
  };

  const footer = isLast
    ? {
        primary: { label: tr('assets.save'), onPress: submit, loading: create.isPending, disabled: nickname.trim().length < 2 },
        back: clamped > 1 ? () => setStep(clamped - 1) : undefined,
      }
    : {
        primary: { label: tr('common.continue'), onPress: () => setStep(clamped + 1), disabled: !canContinue },
        back: clamped > 1 ? () => setStep(clamped - 1) : undefined,
      };

  const META: Record<StepKey, { title: string; sub: string }> = {
    type: { title: tr('assetWizard.type.title'), sub: tr('assetWizard.type.sub') },
    details: { title: tr('assetWizard.details.title'), sub: tr('assetWizard.details.sub') },
    location: { title: tr('assetWizard.location.title'), sub: tr('assetWizard.location.sub') },
    identity: { title: tr('assetWizard.identity.title'), sub: tr('assetWizard.identity.sub') },
  };

  return (
    <Wiz
      cat={tr('assets.addTitle')}
      step={clamped}
      total={total}
      title={META[stepKey].title}
      sub={META[stepKey].sub}
      onBack={goBack}
      footer={footer}
    >
      {stepKey === 'type' ? (
        // Big tappable cards (icon + name + one line), not a compact segment:
        // step 1 was a tiny toggle on an empty screen, and this is the choice the
        // whole flow branches on — it earns the room. Below them, what the type
        // unlocks — so the rest of the step previews the payoff, not blank space.
        <>
        <View style={{ gap: 12 }}>
          {ASSET_TYPES.map((k) => {
            const active = type === k;
            return (
              <Pressable
                key={k}
                onPress={() => { setType(k); setDetail({}); }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: t.radius.card,
                  borderWidth: 1.5,
                  borderColor: active ? t.colors.accent : t.colors.line,
                  backgroundColor: active ? t.colors.accentSoft : t.colors.surface,
                }}
              >
                <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: active ? t.colors.accent : t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={ICON[k]} size={26} color={active ? t.colors.accentInk : t.colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="800" style={{ fontSize: 17 }}>{tr(`assets.type.${k}`)}</Text>
                  <Text variant="caption" color={t.colors.ink3}>{tr(`assetWizard.type.options.${k}`)}</Text>
                </View>
                {active ? <Icon name="check" size={22} color={t.colors.accent} /> : null}
              </Pressable>
            );
          })}
        </View>

        {/* What this type unlocks — fills the step and reacts to the choice. */}
        <View style={{ marginTop: 4, padding: 16, borderRadius: t.radius.card, backgroundColor: t.colors.surface2, gap: 2 }}>
          <Text variant="caption" weight="800" color={t.colors.ink3} style={{ marginBottom: 6 }}>
            {tr('assetWizard.type.benefitsTitle')}
          </Text>
          {BENEFITS[type].map((icon, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 }}>
              <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={icon} size={16} color={t.colors.accent} />
              </View>
              <Text style={{ flex: 1, fontSize: 14 }}>{tr(`assetWizard.type.benefits.${type}.${i}`)}</Text>
            </View>
          ))}
        </View>
        </>
      ) : null}

      {stepKey === 'details' ? (
        <>
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

          {type === 'vehicle' ? (
            <Field
              label={tr('assets.mileage')}
              value={(detail.mileage as string) ?? ''}
              onChangeText={(v) => set('mileage', v.replace(/\D/g, ''))}
              placeholder={tr('assets.kmPlaceholder')}
              keyboardType="numeric"
            />
          ) : null}
        </>
      ) : null}

      {stepKey === 'location' ? (
        <AssetLocationField
          latitude={detail.latitude as number | undefined}
          longitude={detail.longitude as number | undefined}
          geofence={(detail.geofence as GeoPoint[] | undefined) ?? null}
          onChange={(patch) => setDetail((s) => ({ ...s, ...patch }))}
        />
      ) : null}

      {stepKey === 'identity' ? (
        <>
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

          <SectionLabel>{tr('assets.nickname')}</SectionLabel>
          <Field value={nickname} onChangeText={setNickname} placeholder={tr('assets.nicknamePlaceholder')} onSubmitEditing={isLast ? submit : undefined} />
        </>
      ) : null}
    </Wiz>
  );
}
