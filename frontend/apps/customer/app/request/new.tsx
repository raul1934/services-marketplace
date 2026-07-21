import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Alert } from '@chamafacil/shared';
import MapView, { Marker, Polygon } from 'react-native-maps';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ApiError,
  BudgetMeter,
  Card,
  DynamicFields,
  Field,
  Icon,
  IconName,
  PaymentMethod,
  PaymentSelector,
  ReceptionType,
  RequestUrgency,
  Row,
  SectionLabel,
  Segment,
  SuccessSplash,
  Text,
  Toggle,
  Wiz,
  flattenPages,
  useTheme,
} from '@chamafacil/shared';
import { useAssets, useCategories, useCreateRequest } from '../../src/queries';
import { AssetSelector } from '../../src/components/AssetSelector';
import { ICON, assetCaption } from '../../src/assetDisplay';
import { takeCreatedAsset } from '../../src/assetPick';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { Scheduler, Availability } from '../../src/components/Scheduler';
import { getCurrentCoords, reverseGeocode, Coords } from '../../src/location';
import { pickPhotos, uploadPhotos, PickedPhoto } from '../../src/photos';
import { assetsApi } from '../../src/api';

const STEP_KEYS = ['details', 'location', 'questions', 'when', 'photos', 'money', 'review'] as const;
type StepKey = (typeof STEP_KEYS)[number];

export default function NewRequest() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const create = useCreateRequest();
  const { data: categories } = useCategories();
  const category = useMemo(() => categories?.find((c) => c.id === Number(categoryId)), [categories, categoryId]);
  const categoryName = category ? tr(`categories.${category.slug}`, { defaultValue: category.name }) : undefined;

  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [budget, setBudget] = useState(120);
  const [urgency, setUrgency] = useState<RequestUrgency>(RequestUrgency.Urgent);
  const [reception, setReception] = useState<ReceptionType>(ReceptionType.AdultKey);
  const [entryCode, setEntryCode] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>(PaymentMethod.Pix);
  const [maxWaitMinutes, setMaxWaitMinutes] = useState<'10' | '20' | '30'>('20');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const questions = category?.questions ?? [];

  // Asset selector — categories that map to an asset type require picking one.
  const assetType = category?.asset_type ?? null;
  // "Who receives the pro" (adult with key / entry code) only makes sense at a
  // fixed address the customer may not be at — a home. It's meaningless for a
  // roadside call, where the customer is standing by the vehicle, so hide it.
  const showAccess = category?.type !== 'roadside' && assetType !== 'vehicle';
  // Set on a successful submit so the success splash plays before navigating.
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const assets = useAssets(assetType ?? undefined, assetType != null);
  const assetList = flattenPages(assets.data?.pages);
  const [assetId, setAssetId] = useState<number | null>(null);
  const selectedAsset = assetList.find((a) => a.id === assetId);
  // Whether to share the asset's provider note with the pro. Private by default.
  const [shareNote, setShareNote] = useState(false);

  // With exactly one asset of the needed type, picking it isn't a guess — it's
  // the only answer. Choose it, and say so below (`autoPicked`), so the choice
  // is visible rather than silent. Never overrides a pick already made.
  const autoPicked = assetId != null && assetList.length === 1 && assetList[0].id === assetId;
  useEffect(() => {
    if (assetId == null && assetList.length === 1) setAssetId(assetList[0].id);
  }, [assetId, assetList]);

  // Returning from /assets/new (pick mode): auto-select the asset just created.
  useFocusEffect(
    useCallback(() => {
      const id = takeCreatedAsset();
      if (id != null) setAssetId(id);
    }, []),
  );

  const onAddNew = () => {
    if (assetType) router.push(`/assets/new?pick=1&type=${assetType}`);
  };

  // A property asset can carry its own saved location (map pin) and address. The
  // location step then shows that position on the map and reuses the asset address
  // instead of asking for the street again.
  const detail = selectedAsset?.detail;
  const assetCoords =
    assetType === 'property' && detail?.latitude != null && detail?.longitude != null
      ? { latitude: detail.latitude as number, longitude: detail.longitude as number }
      : null;
  const assetAddress = (assetType === 'property' ? (detail?.address as string | null | undefined) : undefined) || undefined;
  const assetGeofence = (assetType === 'property' ? (detail?.geofence as { latitude: number; longitude: number }[] | null | undefined) : null) ?? null;
  // Location used on submit/review when the asset already has coordinates.
  const assetLocation = assetCoords ? { ...assetCoords, address: assetAddress } : null;

  // Hide category questions the selected asset already answers (no double entry).
  const visibleQuestions = questions.filter((q) => {
    const field = ({ floor: 'floor', unit: 'unit', address: 'address' } as Record<string, string>)[q.key];
    return !(field && detail && (detail as Record<string, unknown>)[field]);
  });

  // All steps are shown; the location step adapts to the selected asset's location.
  const stepKeys: readonly StepKey[] = STEP_KEYS;
  const TOTAL = stepKeys.length;
  const stepKey = stepKeys[Math.min(step, TOTAL) - 1];
  const goTo = (key: StepKey) => {
    const i = stepKeys.indexOf(key);
    if (i >= 0) setStep(i + 1);
  };

  const locate = async () => {
    setLocating(true);
    try {
      const c = await getCurrentCoords();
      setCoords(c);
      if (c.address) setAddress(c.address);
    } catch (e) {
      Alert.alert(tr('createRequest.locationErrorTitle'), (e as Error).message);
    } finally {
      setLocating(false);
    }
  };

  // Vehicle categories let the customer fine-tune the pin by panning the map
  // (center-pin picker); each settle re-geocodes into the address field below.
  const pickCoords = async (c: { latitude: number; longitude: number }) => {
    setCoords({ latitude: c.latitude, longitude: c.longitude });
    const addr = await reverseGeocode(c);
    if (addr) setAddress(addr);
  };

  const addPhotos = async () => {
    try {
      const picked = await pickPhotos(5 - photos.length);
      setPhotos((p) => [...p, ...picked].slice(0, 5));
    } catch (e) {
      Alert.alert(tr('createRequest.photosErrorTitle'), (e as Error).message);
    }
  };

  const submit = async () => {
    const loc = assetLocation ?? coords;
    if (!loc) return;
    try {
      // Upload-first: upload the photos, then attach them via media_ids on create.
      let mediaIds: number[] | undefined;
      if (photos.length) {
        try {
          mediaIds = (await uploadPhotos(photos)).map((m) => m.id);
        } catch {
          /* non-fatal — create the request without photos */
        }
      }

      const req = await create.mutateAsync({
        service_category_id: Number(categoryId),
        asset_id: assetId ?? undefined,
        description: description.trim(),
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: assetLocation ? assetLocation.address : (assetAddress || address.trim() || undefined),
        budget_max: budget,
        payment_method: payment,
        answers: Object.entries(answers)
          .filter(([, v]) => v.trim() !== '')
          .map(([id, v]) => ({ question_id: Number(id), answer: v.trim() })),
        urgency,
        max_wait_minutes: urgency === RequestUrgency.Urgent ? Number(maxWaitMinutes) : undefined,
        reception_type: showAccess ? reception : undefined,
        entry_code: showAccess && reception === ReceptionType.EntryCode ? entryCode.trim() || undefined : undefined,
        availabilities: urgency === RequestUrgency.Scheduled ? availabilities : undefined,
        media_ids: mediaIds,
        share_asset_note: selectedAsset?.provider_note ? shareNote : undefined,
      });

      // Remember the captured location on the property asset for next time.
      if (!assetLocation && assetType === 'property' && selectedAsset && coords) {
        assetsApi
          .update(selectedAsset.id, { detail: { latitude: coords.latitude, longitude: coords.longitude, address: address.trim() || undefined } })
          .catch(() => {});
      }

      // Celebrate the send with a full-screen success splash, then land on the
      // request. This gives the peak effort (the slide) a satisfying payoff
      // instead of jumping straight into the "waiting for proposals" state.
      setSubmittedId(req.id);
    } catch (e) {
      Alert.alert(tr('common.error'), e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  const META: Record<StepKey, { title: string; sub: string }> = {
    details: { title: tr('createRequest.wizProblemTitle'), sub: tr('createRequest.wizProblemSub') },
    location: { title: tr('createRequest.wizLocationTitle'), sub: tr('createRequest.wizLocationSub') },
    questions: { title: tr('createRequest.wizQuestionsTitle'), sub: tr('createRequest.wizQuestionsSub') },
    when: { title: tr('createRequest.wizWhenTitle'), sub: tr('createRequest.wizWhenSub') },
    photos: { title: tr('createRequest.wizPhotosTitle'), sub: tr('createRequest.wizPhotosSub') },
    money: { title: tr('createRequest.wizMoneyTitle'), sub: tr('createRequest.wizMoneySub') },
    review: { title: tr('createRequest.wizReviewTitle'), sub: tr('createRequest.wizReviewSub') },
  };
  const canContinue =
    (stepKey === 'details' && description.trim().length >= 5 && (assetType == null || assetId != null)) ||
    (stepKey === 'location' && (!!coords || !!assetCoords)) ||
    stepKey === 'questions' || // optional
    (stepKey === 'when' && (urgency === RequestUrgency.Urgent || availabilities.length > 0)) ||
    stepKey === 'photos' || // optional
    stepKey === 'money'; // budget/payment have defaults

  const footer =
    step < TOTAL
      ? { primary: { label: tr('common.continue'), onPress: () => setStep(step + 1), disabled: !canContinue }, back: step > 1 ? () => setStep(step - 1) : undefined }
      : { slide: { label: tr('createRequest.slideRequest'), doneLabel: tr('createRequest.slideRequested'), onConfirm: submit, disabled: create.isPending }, back: () => setStep(step - 1) };

  // When the step's requirement isn't met yet, say what's missing instead of
  // leaving a silently-dead "Continue" button (the user can't tell why it's off).
  const hint = canContinue
    ? null
    : stepKey === 'details'
      ? description.trim().length < 5
        ? tr('createRequest.needDescription')
        : assetType != null && assetId == null
          ? tr('createRequest.needAsset')
          : null
      : stepKey === 'location'
        ? tr('createRequest.needLocation')
        : stepKey === 'when'
          ? tr('createRequest.needWhen')
          : null;

  const accessLabel = reception === ReceptionType.EntryCode
    ? `${tr('enums.receptionType.entry_code')}${entryCode.trim() ? ` · ${entryCode.trim()}` : ''}`
    : tr('enums.receptionType.adult_key');

  // "Who receives the pro" — lives in the location step, or in step 1 when that
  // step is skipped (asset-derived location), so it's never lost.
  const accessBlock = (
    <>
      <SectionLabel>{tr('createRequest.accessLabel')}</SectionLabel>
      <Segment
        items={[
          { value: ReceptionType.AdultKey, label: tr('enums.receptionType.adult_key') },
          { value: ReceptionType.EntryCode, label: tr('enums.receptionType.entry_code') },
        ]}
        value={reception}
        onChange={setReception}
      />
      {reception === ReceptionType.EntryCode && (
        <Field label={tr('createRequest.entryCodeLabel')} value={entryCode} onChangeText={setEntryCode} placeholder={tr('createRequest.entryCodePlaceholder')} />
      )}
    </>
  );

  return (
    <>
    {submittedId != null && <SuccessSplash onDone={() => router.replace(`/request/${submittedId}`)} />}
    <Wiz
      cat={categoryName ?? tr('createRequest.title')}
      step={step}
      total={TOTAL}
      title={META[stepKey].title}
      sub={stepKey === 'location' && assetCoords ? tr('createRequest.assetLocationUsed') : META[stepKey].sub}
      onBack={() => {
        if (step !== 1) {
          setStep(step - 1);
        } else if (router.canGoBack()) {
          // Landing here with no history (deep link, or the app's very first
          // screen on web) makes router.back() a silent no-op — the close
          // button would look broken. Fall back to a known-good destination.
          router.back();
        } else {
          router.replace('/');
        }
      }}
      footer={footer}
    >
      {/* STEP 1 — details (asset + description) */}
      {stepKey === 'details' && (
        <>
          <Row style={{ gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <CategoryIcon category={category} size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="800" style={{ fontSize: 15.5 }}>
                {category ? `${tr(`enums.categoryType.${category.type}`)} · ${categoryName}` : tr('createRequest.title')}
              </Text>
              <Text variant="caption">{tr('createRequest.tellUs')}</Text>
            </View>
          </Row>
          {assetType && (
            <AssetSelector
              assetType={assetType}
              assets={assetList}
              selectedId={assetId}
              onSelect={setAssetId}
              onAddNew={onAddNew}
              loading={assets.isLoading}
              note={autoPicked ? tr('createRequest.assetAutoPicked') : undefined}
            />
          )}

          {/* The asset carries a note for pros; sharing it is per-request and
              off by default (it may hold a gate code, etc). */}
          {selectedAsset?.provider_note ? (
            <Pressable onPress={() => setShareNote((v) => !v)}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text weight="700" style={{ fontSize: 14.5 }}>{tr('createRequest.shareNote')}</Text>
                  <Text variant="caption" color={t.colors.ink3} numberOfLines={2}>“{selectedAsset.provider_note}”</Text>
                </View>
                <Toggle on={shareNote} />
              </Card>
            </Pressable>
          ) : null}

          <Field label={tr('createRequest.whatHappened')} value={description} onChangeText={setDescription} placeholder={tr('createRequest.whatHappenedPlaceholder')} multiline voiceInput style={{ height: 84, textAlignVertical: 'top' }} />
        </>
      )}

      {/* STEP 2 — location & access */}
      {stepKey === 'location' && (
        <>
          {assetCoords ? (
            // The selected asset already has a saved position → show it on the map
            // and reuse the asset's address (no GPS capture or street entry needed).
            <>
              <Card padded={false} style={{ overflow: 'hidden' }}>
                <View style={{ height: 200 }} pointerEvents="none">
                  <MapView style={{ flex: 1 }} region={{ latitude: assetCoords.latitude, longitude: assetCoords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
                    <Marker coordinate={{ latitude: assetCoords.latitude, longitude: assetCoords.longitude }} pinColor={t.colors.accent} />
                    {assetGeofence && assetGeofence.length >= 2 && (
                      <Polygon coordinates={assetGeofence} strokeColor={t.colors.accent} fillColor={`${t.colors.accent}33`} strokeWidth={2} />
                    )}
                  </MapView>
                </View>
                <Row style={{ padding: 14, gap: 8 }}>
                  <Icon name="location" size={18} color={t.colors.accent} />
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
                    {assetAddress || selectedAsset?.nickname || tr('createRequest.assetLocationUsed')}
                  </Text>
                  <Icon name="check" size={18} color={t.colors.ok} />
                </Row>
              </Card>
            </>
          ) : (
            <>
              <Card padded={false} style={{ overflow: 'hidden' }}>
                {coords ? (
                  assetType === 'vehicle' ? (
                    <View style={{ height: 200 }}>
                      <MapView
                        style={{ flex: 1 }}
                        initialRegion={{ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                        onRegionChangeComplete={(r) => pickCoords({ latitude: r.latitude, longitude: r.longitude })}
                      />
                      <View pointerEvents="none" style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -14, marginTop: -28, zIndex: 1000 }}>
                        <Icon name="location" size={28} color={t.colors.accent} />
                      </View>
                    </View>
                  ) : (
                    <MapView style={{ height: 200 }} region={{ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
                      <Marker coordinate={{ latitude: coords.latitude, longitude: coords.longitude }} pinColor={t.colors.accent} />
                    </MapView>
                  )
                ) : (
                  <Pressable onPress={locate} style={{ height: 200, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Icon name="location" size={28} color={t.colors.accent} />
                    <Text weight="700" color={t.colors.accent}>{locating ? tr('createRequest.locating') : tr('createRequest.useLocation')}</Text>
                  </Pressable>
                )}
                <Row style={{ padding: 14 }}>
                  <Icon name="location" size={18} color={t.colors.accent} />
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '600' }}>
                    {coords ? (assetType === 'vehicle' ? tr('createRequest.locationCaptured') : tr('createRequest.gpsCaptured')) : tr('createRequest.tapLocation')}
                  </Text>
                  {coords && <Icon name="check" size={18} color={t.colors.ok} />}
                </Row>
              </Card>
              {/* Reuse the asset's saved address when it has one; otherwise ask for the street. */}
              {assetAddress ? null : (
                <Field label={tr('createRequest.addressLabel')} value={address} onChangeText={setAddress} placeholder={tr('createRequest.addressPlaceholder')} />
              )}
            </>
          )}
          {showAccess && accessBlock}
        </>
      )}

      {/* STEP 3 — category-specific questions (optional) */}
      {stepKey === 'questions' && (
        <>
          {visibleQuestions.length > 0 ? (
            <DynamicFields
              questions={visibleQuestions}
              values={answers}
              onChange={(id, value) => setAnswers((s) => ({ ...s, [id]: value }))}
            />
          ) : (
            <Text variant="caption">{tr('createRequest.noExtraQuestions')}</Text>
          )}
        </>
      )}

      {/* STEP 4 — when / scheduling */}
      {stepKey === 'when' && (
        <>
          <SectionLabel>{tr('createRequest.when')}</SectionLabel>
          <Segment
            items={[
              { value: RequestUrgency.Urgent, label: tr('enums.urgency.urgent') },
              { value: RequestUrgency.Scheduled, label: tr('enums.urgency.scheduled') },
            ]}
            value={urgency}
            onChange={setUrgency}
          />
          {urgency === RequestUrgency.Urgent ? (
            <>
              <Row style={{ gap: 12, backgroundColor: t.colors.accentSoft, borderRadius: 14, padding: 14 }}>
                <Icon name="flash" size={20} color={t.colors.accent} fill="current" />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '700' }} color={t.colors.accent}>{tr('createRequest.urgentNow')}</Text>
              </Row>
              <SectionLabel>{tr('createRequest.maxWaitLabel')}</SectionLabel>
              <Segment
                items={(['10', '20', '30'] as const).map((m) => ({ value: m, label: tr('createRequest.maxWaitOption', { count: Number(m) }) }))}
                value={maxWaitMinutes}
                onChange={setMaxWaitMinutes}
              />
            </>
          ) : (
            <Scheduler onChange={setAvailabilities} />
          )}
        </>
      )}

      {/* STEP 5 — photos (optional) */}
      {stepKey === 'photos' && (
        <>
          <SectionLabel>{tr('createRequest.photos')}</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {photos.map((p) => (
              <View key={p.uri}>
                <Image source={{ uri: p.uri }} style={{ width: 80, height: 80, borderRadius: 14 }} />
                <Pressable
                  onPress={() => setPhotos((cur) => cur.filter((x) => x.uri !== p.uri))}
                  style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: t.colors.ink, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="close" size={13} color="#fff" />
                </Pressable>
              </View>
            ))}
            {photos.length < 5 && (
              <Pressable onPress={addPhotos} style={{ width: 80, height: 80, borderRadius: 14, borderWidth: 1, borderColor: t.colors.line, borderStyle: 'dashed', backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Icon name="camera" size={20} color={t.colors.ink3} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: t.colors.ink3 }}>{tr('createRequest.addPhoto')}</Text>
              </Pressable>
            )}
          </View>
        </>
      )}

      {/* STEP 6 — budget & payment */}
      {stepKey === 'money' && (
        <>
          <BudgetMeter
            value={budget}
            onChange={setBudget}
            min={60}
            max={300}
            step={5}
            bandLo={90}
            bandHi={160}
            regionAvg={120}
            mode="budget"
            label={tr('createRequest.budgetLabel')}
            currency={tr('common.currency')}
            pill={tr('createRequest.suggested')}
            renderInfo={({ word, value, avg }) => (
              <Text style={{ fontSize: 12.5, fontWeight: '600', color: t.colors.ink2, lineHeight: 18 }}>
                {tr('createRequest.budgetInfo', { work: categoryName ?? tr('createRequest.thisJob'), avg, value, chance: tr(`createRequest.chance.${word}`) })}
              </Text>
            )}
          />
          <SectionLabel>{tr('createRequest.paymentLabel')}</SectionLabel>
          <PaymentSelector
            value={payment}
            onChange={setPayment}
            options={[
              { value: PaymentMethod.Pix, icon: 'pix', label: tr('payment.pix'), detail: tr('payment.pixDetail') },
              { value: PaymentMethod.Card, icon: 'card', label: tr('payment.card'), detail: tr('payment.cardDetail') },
              { value: PaymentMethod.Cash, icon: 'cash', label: tr('payment.cash'), detail: tr('payment.cashDetail') },
            ]}
          />
        </>
      )}

      {/* STEP 7 — review (read-only synthesis) */}
      {stepKey === 'review' && (
        <Card>
          <SumRow icon="list" k={tr('createRequest.summaryService')} v={categoryName ?? '—'} onPress={() => goTo('details')} />
          {selectedAsset && (
            <SumRow
              icon={ICON[selectedAsset.type] ?? 'car'}
              k={tr(`assets.type.${selectedAsset.type}`)}
              v={[selectedAsset.nickname, assetCaption(selectedAsset, tr)].filter(Boolean).join(' · ')}
              onPress={() => goTo('details')}
            />
          )}
          {description.trim() !== '' && (
            <SumRow icon="edit" k={tr('createRequest.summaryDescription')} v={description.trim()} onPress={() => goTo('details')} />
          )}
          {visibleQuestions
            .filter((q) => (answers[q.id] ?? '').trim() !== '')
            .map((q) => <SumRow key={q.id} icon="check" k={q.label} v={answers[q.id]} onPress={() => goTo('questions')} />)}
          <SumRow icon="camera" k={tr('createRequest.photos')} v={tr('createRequest.summaryPhotos', { count: photos.length })} onPress={() => goTo('photos')} />
          <SumRow icon="location" k={tr('createRequest.addressLabel')} v={assetLocation?.address || assetAddress || address || tr('createRequest.gpsCaptured')} onPress={() => goTo('location')} />
          {showAccess && <SumRow icon="key" k={tr('createRequest.accessLabel')} v={accessLabel} onPress={() => goTo('location')} />}
          <SumRow
            icon="calendar"
            k={tr('createRequest.when')}
            v={urgency === RequestUrgency.Urgent ? tr('enums.urgency.urgentWithWait', { count: Number(maxWaitMinutes) }) : tr('createRequest.windowsCount', { count: availabilities.length })}
            onPress={() => goTo('when')}
          />
          <SumRow icon="dollar" k={tr('createRequest.summaryBudget')} v={`${tr('common.currency')} ${budget}`} onPress={() => goTo('money')} />
          <SumRow icon={payment} k={tr('createRequest.summaryPayment')} v={tr(`payment.${payment}`)} onPress={() => goTo('money')} last />
        </Card>
      )}

      {hint ? (
        <Text center weight="600" color={t.colors.ink2} style={{ fontSize: 12.5, marginTop: 2 }}>{hint}</Text>
      ) : null}
    </Wiz>
    </>
  );
}

function SumRow({ icon, k, v, onPress, last }: { icon: IconName; k: string; v: string; onPress?: () => void; last?: boolean }) {
  const t = useTheme();
  const body = (
    <Row style={{ gap: 12, paddingVertical: 11, borderTopWidth: 0 }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={t.colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="caption" weight="700">{k}</Text>
        <Text weight="700" style={{ fontSize: 14.5, marginTop: 1 }} numberOfLines={2}>{v}</Text>
      </View>
      {onPress && <Icon name="edit" size={15} color={t.colors.ink3} />}
    </Row>
  );
  const wrapped = onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
  if (last) return wrapped;
  return <View style={{ borderBottomWidth: 1, borderColor: t.colors.line }}>{wrapped}</View>;
}
