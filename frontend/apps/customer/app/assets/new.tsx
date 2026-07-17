import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Card, Field, Icon, IconName, SectionLabel, Text, Wiz, useTheme } from '@chamafacil/shared';
import { useCategories, useCreateAsset } from '../../src/queries';
import { setCreatedAsset } from '../../src/assetPick';
import { ICON } from '../../src/assetDisplay';
import { ASSET_FIELDS, ASSET_TYPES, AssetTypeKey } from '../../src/assetFields';
import { AssetDetailInput, GeoPoint } from '../../src/api';
import { AssetLocationField } from '../../src/components/AssetLocationField';
import { GeofenceEditor } from '../../src/components/GeofenceEditor';
import { formatAddress } from '../../src/location';
import { MakeModelPicker } from '../../src/components/MakeModelPicker';
import { PetSpeciesBreedPicker } from '../../src/components/PetSpeciesBreedPicker';
import { PropertyTypePicker } from '../../src/components/PropertyTypePicker';
import { DatePicker } from '../../src/components/DatePicker';
import { PickedPhoto, uploadPhotos, pickPhotos } from '../../src/photos';

type StepKey = 'type' | 'details' | 'location' | 'area';

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
  const categories = useCategories();
  // How many services each type unlocks — a real count off the catalog
  // (categories carry asset_type), shown on the card so the choice has weight.
  const serviceCount = (k: AssetTypeKey) => (categories.data ?? []).filter((c) => c.asset_type === k).length;
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
  const [showExtra, setShowExtra] = useState(false); // optional free-text fields
  const [areaOpen, setAreaOpen] = useState(false); // geofence editor modal
  const [tutorialOpen, setTutorialOpen] = useState(false); // transparent how-to overlay
  const [privateNote, setPrivateNote] = useState('');
  const [providerNote, setProviderNote] = useState('');

  const hasCoords = detail.latitude != null && detail.longitude != null;
  const geofence = (detail.geofence as GeoPoint[] | undefined) ?? null;

  // Free-text extras shown under "mais detalhes"; a property's address moves to
  // the location step (it belongs with the map pin), so it's excluded here.
  const extraFields = ASSET_FIELDS[type].filter((f) => !(type === 'property' && f.key === 'address'));

  const set = (k: string, v: string | number | null) => setDetail((s) => ({ ...s, [k]: v }));

  // Steps depend on the type (a property adds location + area) and the entry
  // point (a picker fixes the type, so its step is dropped). Name and photo now
  // live at the top of `details`, so there's no separate identity step.
  const stepKeys = useMemo<StepKey[]>(() => {
    const middle: StepKey[] = type === 'property' ? ['details', 'location', 'area'] : ['details'];
    return picking ? middle : ['type', ...middle];
  }, [type, picking]);

  const total = stepKeys.length;
  const clamped = Math.min(step, total);
  const stepKey = stepKeys[clamped - 1];
  const isLast = clamped === total;

  // Open the how-to overlay when the area step first appears (nothing drawn yet).
  useEffect(() => {
    if (stepKey === 'area' && !geofence?.length) setTutorialOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);

  // Re-nudge: after 10s idle on the area step (overlay dismissed, editor closed,
  // nothing drawn yet), bring the how-to back.
  useEffect(() => {
    if (stepKey !== 'area' || tutorialOpen || areaOpen || geofence?.length) return;
    const timer = setTimeout(() => setTutorialOpen(true), 10000);
    return () => clearTimeout(timer);
  }, [stepKey, tutorialOpen, areaOpen, geofence]);

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
    // Compose a one-line address from the structured parts so the request flow
    // (which reads detail.address) still has something readable to show.
    const composed = formatAddress({
      street: detail.street as string | undefined,
      number: detail.number as string | undefined,
      neighborhood: detail.neighborhood as string | undefined,
      city: detail.city as string | undefined,
      state: detail.state as string | undefined,
    });
    const detailOut = composed ? { ...detail, address: composed } : detail;

    create.mutate(
      {
        type,
        nickname: nickname.trim(),
        detail: detailOut,
        photo_media_id: photoMediaId,
        ...(privateNote.trim() ? { private_note: privateNote.trim() } : {}),
        ...(providerNote.trim() ? { provider_note: providerNote.trim() } : {}),
      },
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

  // The name (on the details step) is the only requirement; location and area
  // are optional, so no other step traps you.
  const canContinue =
    stepKey === 'type' ||
    (stepKey === 'details' && nickname.trim().length >= 2) ||
    stepKey === 'location' ||
    stepKey === 'area';

  const goBack = () => {
    if (clamped > 1) return setStep(clamped - 1);
    return router.canGoBack() ? router.back() : router.replace('/assets');
  };

  const footer = isLast
    ? {
        primary: { label: tr('assets.save'), onPress: submit, loading: create.isPending, disabled: nickname.trim().length < 2, pulse: true },
        back: clamped > 1 ? () => setStep(clamped - 1) : undefined,
      }
    : {
        primary: { label: tr('common.continue'), onPress: () => setStep(clamped + 1), disabled: !canContinue, pulse: true },
        back: clamped > 1 ? () => setStep(clamped - 1) : undefined,
      };

  const META: Record<StepKey, { title: string; sub: string }> = {
    type: { title: tr('assetWizard.type.title'), sub: tr('assetWizard.type.sub') },
    details: { title: tr('assetWizard.details.title'), sub: tr('assetWizard.details.sub') },
    location: { title: tr('assetWizard.location.title'), sub: tr('assetWizard.location.sub') },
    area: { title: tr('assetWizard.area.title'), sub: tr('assetWizard.area.sub') },
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
        // Big tappable cards (icon + name + one line + service count), not a
        // compact segment. The selected card expands to reveal what the type
        // unlocks — right under the choice, not in a detached box — and the
        // reveal animates as selection moves from one card to the next.
        <View style={{ gap: 12 }}>
          {ASSET_TYPES.map((k) => {
            const active = type === k;
            return (
              // `layout` animates the card's own height and pushes the ones below
              // as the benefits reveal grows/shrinks — the smooth expand/contract.
              <Animated.View key={k} layout={LinearTransition.duration(240)}>
                <Pressable
                  onPress={() => { setType(k); setDetail({}); }}
                  style={{
                    padding: 16,
                    borderRadius: t.radius.card,
                    borderWidth: 1.5,
                    borderColor: active ? t.colors.accent : t.colors.line,
                    backgroundColor: active ? t.colors.accentSoft : t.colors.surface,
                    gap: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: active ? t.colors.accent : t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={ICON[k]} size={26} color={active ? t.colors.accentInk : t.colors.accent} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text weight="800" style={{ fontSize: 17 }}>{tr(`assets.type.${k}`)}</Text>
                      <Text variant="caption" color={t.colors.ink3}>{tr(`assetWizard.type.options.${k}`)}</Text>
                      {serviceCount(k) > 0 ? (
                        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: active ? t.colors.accent : t.colors.accentSoft, marginTop: 2 }}>
                          <Icon name="wrench" size={11} color={active ? t.colors.accentInk : t.colors.accent} />
                          <Text weight="800" style={{ fontSize: 11.5 }} color={active ? t.colors.accentInk : t.colors.accent}>
                            {tr('assetWizard.type.serviceCount', { count: serviceCount(k) })}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {active ? <Icon name="check" size={22} color={t.colors.accent} /> : null}
                  </View>

                  {/* Revealed only for the chosen type. entering/exiting fade it
                      in and out while the card's `layout` animates the height. */}
                  {active ? (
                    <Animated.View
                      entering={FadeIn.duration(220)}
                      exiting={FadeOut.duration(140)}
                      style={{ gap: 2, borderTopWidth: 1, borderColor: t.colors.line, paddingTop: 8 }}
                    >
                      {BENEFITS[k].map((icon, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name={icon} size={15} color={t.colors.accent} />
                          </View>
                          <Text style={{ flex: 1, fontSize: 14 }}>{tr(`assetWizard.type.benefits.${k}.${i}`)}</Text>
                        </View>
                      ))}
                    </Animated.View>
                  ) : null}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      ) : null}

      {stepKey === 'details' ? (
        <>
          {/* Name first — what you'll call it — then a photo to recognise it. */}
          <Field
            label={tr('assets.nickname')}
            value={nickname}
            onChangeText={setNickname}
            placeholder={tr('assets.nicknamePlaceholder')}
          />
          <Pressable onPress={pick} style={{ alignSelf: 'center', alignItems: 'center', gap: 6 }}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={{ width: 88, height: 88, borderRadius: 18 }} />
            ) : (
              <View style={{ width: 88, height: 88, borderRadius: 18, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={26} color={t.colors.accent} />
              </View>
            )}
            <Text variant="caption" color={t.colors.accent}>{photo ? tr('assets.changePhoto') : tr('assets.addPhoto')}</Text>
          </Pressable>

          {/* The one structured field that matters — it drives the room
              suggestions (property) or the catalog (vehicle/pet). */}
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

          {/* Mileage stays in view — it's a defining vehicle attribute, not an
              afterthought like the free-text extras below. */}
          {type === 'vehicle' ? (
            <Field
              label={tr('assets.mileage')}
              value={(detail.mileage as string) ?? ''}
              onChangeText={(v) => set('mileage', v.replace(/\D/g, ''))}
              placeholder={tr('assets.kmPlaceholder')}
              keyboardType="numeric"
            />
          ) : null}

          {/* Everything else is optional free text — folded away so the step
              reads as one choice, not a wall of inputs. */}
          {extraFields.length ? (
            <View style={{ gap: 12 }}>
              <Pressable onPress={() => setShowExtra((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                <Icon name={showExtra ? 'check' : 'plus'} size={16} color={t.colors.accent} />
                <Text weight="700" color={t.colors.accent}>
                  {showExtra ? tr('assetWizard.details.less') : tr('assetWizard.details.more')}
                </Text>
              </Pressable>
              {showExtra ? (
                <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(140)} style={{ gap: 13 }}>
                  {extraFields.map((f) =>
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
                </Animated.View>
              ) : null}
            </View>
          ) : null}

          {/* Two notes: one only you ever see, one you may share with a pro. */}
          <View style={{ gap: 12, marginTop: 4 }}>
            <SectionLabel>{tr('assetWizard.notes.sectionLabel')}</SectionLabel>
            <Field
              label={tr('assetWizard.notes.private')}
              hint={tr('assetWizard.notes.privateHint')}
              value={privateNote}
              onChangeText={setPrivateNote}
              multiline
              style={{ height: 88, textAlignVertical: 'top' }}
            />
            <Field
              label={tr('assetWizard.notes.provider')}
              hint={tr('assetWizard.notes.providerHint')}
              value={providerNote}
              onChangeText={setProviderNote}
              multiline
              style={{ height: 88, textAlignVertical: 'top' }}
            />
          </View>
        </>
      ) : null}

      {stepKey === 'location' ? (
        <>
          {/* Structured address, in its own fields (and columns) — "use my
              location" fills them by reverse-geocode, or type them. */}
          <Field label={tr('assets.fields.cep')} value={(detail.cep as string) ?? ''} onChangeText={(v) => set('cep', v)} placeholder="00000-000" keyboardType="numeric" />
          <Field label={tr('assets.fields.street')} value={(detail.street as string) ?? ''} onChangeText={(v) => set('street', v)} placeholder="Rua das Flores" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label={tr('assets.fields.number')} value={(detail.number as string) ?? ''} onChangeText={(v) => set('number', v)} placeholder="100" keyboardType="numeric" />
            </View>
            <View style={{ flex: 2 }}>
              <Field label={tr('assets.fields.neighborhood')} value={(detail.neighborhood as string) ?? ''} onChangeText={(v) => set('neighborhood', v)} placeholder="Centro" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 2 }}>
              <Field label={tr('assets.fields.city')} value={(detail.city as string) ?? ''} onChangeText={(v) => set('city', v)} placeholder="São Paulo" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={tr('assets.fields.state')} value={(detail.state as string) ?? ''} onChangeText={(v) => set('state', v.toUpperCase().slice(0, 2))} placeholder="SP" autoCapitalize="characters" maxLength={2} />
            </View>
          </View>
          <AssetLocationField
            latitude={detail.latitude as number | undefined}
            longitude={detail.longitude as number | undefined}
            geofence={(detail.geofence as GeoPoint[] | undefined) ?? null}
            onChange={(patch) => setDetail((s) => ({ ...s, ...patch }))}
            height={300}
            hideArea
          />
        </>
      ) : null}

      {stepKey === 'area' ? (
        <View style={{ gap: 12 }}>
          {/* The area shown on the map. Non-interactive preview — no scroll steal. */}
          {hasCoords ? (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <View pointerEvents="none" style={{ height: 300 }}>
                <MapView style={{ flex: 1 }} region={{ latitude: detail.latitude as number, longitude: detail.longitude as number, latitudeDelta: 0.006, longitudeDelta: 0.006 }}>
                  <Marker coordinate={{ latitude: detail.latitude as number, longitude: detail.longitude as number }} pinColor={t.colors.accent} />
                  {geofence && geofence.length >= 2 ? (
                    <Polygon coordinates={geofence} strokeColor={t.colors.accent} fillColor={`${t.colors.accent}33`} strokeWidth={2} />
                  ) : null}
                </MapView>
              </View>
            </Card>
          ) : (
            <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="location" size={24} color={t.colors.accent} />
              </View>
              <Text variant="caption" center color={t.colors.ink3}>{tr('assetWizard.area.needLocation')}</Text>
            </Card>
          )}

          <Button
            title={geofence?.length ? tr('assets.editArea', { count: geofence.length }) : tr('assetWizard.area.draw')}
            variant={geofence?.length ? 'soft' : undefined}
            full
            disabled={!hasCoords}
            onPress={() => (geofence?.length ? setAreaOpen(true) : setTutorialOpen(true))}
            left={<Icon name="plus" size={16} color={geofence?.length ? t.colors.accent : t.colors.accentInk} />}
          />
          <Text variant="caption" color={t.colors.ink3} center>{tr('assetWizard.area.optional')}</Text>

          {/* Transparent how-to overlay; its button starts the actual drawing. */}
          <Modal visible={tutorialOpen && hasCoords} transparent animationType="fade" onRequestClose={() => setTutorialOpen(false)} statusBarTranslucent>
            <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }} onPress={() => setTutorialOpen(false)}>
              <Pressable onPress={() => {}} style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="home" size={20} color={t.colors.accent} />
                  </View>
                  <Text weight="800" style={{ flex: 1, fontSize: 18 }}>{tr('assetWizard.area.tutorialTitle')}</Text>
                </View>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                      <Text weight="800" color={t.colors.accentInk} style={{ fontSize: 12 }}>{i + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14.5, lineHeight: 21 }} color={t.colors.ink2}>{tr(`assetWizard.area.steps.${i}`)}</Text>
                  </View>
                ))}
                <Button title={tr('assetWizard.area.start')} full onPress={() => { setTutorialOpen(false); setAreaOpen(true); }} left={<Icon name="plus" size={16} color={t.colors.accentInk} />} />
                <Button title={tr('assetWizard.area.notNow')} variant="ghost" full onPress={() => setTutorialOpen(false)} />
              </Pressable>
            </Pressable>
          </Modal>

          {hasCoords ? (
            <GeofenceEditor
              visible={areaOpen}
              center={{ latitude: detail.latitude as number, longitude: detail.longitude as number }}
              value={geofence}
              onClose={() => setAreaOpen(false)}
              onSave={(poly) => {
                setDetail((s) => ({ ...s, geofence: poly }));
                setAreaOpen(false);
              }}
            />
          ) : null}
        </View>
      ) : null}
    </Wiz>
  );
}
