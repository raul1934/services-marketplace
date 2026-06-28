import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ApiError,
  BudgetMeter,
  Card,
  DynamicFields,
  Field,
  Icon,
  PaymentMethod,
  PaymentSelector,
  ReceptionType,
  RequestUrgency,
  Row,
  SectionLabel,
  Segment,
  Text,
  Wiz,
  flattenPages,
  useTheme,
} from '@walvee/shared';
import { useAssets, useCategories, useCreateRequest } from '../../src/queries';
import { AssetSelector } from '../../src/components/AssetSelector';
import { ICON, assetCaption } from '../../src/assetDisplay';
import { takeCreatedAsset } from '../../src/assetPick';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { Scheduler, Availability } from '../../src/components/Scheduler';
import { getCurrentCoords, Coords } from '../../src/location';
import { pickPhotos, uploadPhotos, PickedPhoto } from '../../src/photos';

const TOTAL = 6;

export default function NewRequest() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const create = useCreateRequest();
  const { data: categories } = useCategories();
  const category = useMemo(() => categories?.find((c) => c.id === Number(categoryId)), [categories, categoryId]);

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
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const questions = category?.questions ?? [];

  // Asset selector — categories that map to an asset type require picking one.
  const assetType = category?.asset_type ?? null;
  const assets = useAssets(assetType ?? undefined, assetType != null);
  const assetList = flattenPages(assets.data?.pages);
  const [assetId, setAssetId] = useState<number | null>(null);
  const selectedAsset = assetList.find((a) => a.id === assetId);

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

  const addPhotos = async () => {
    try {
      const picked = await pickPhotos(5 - photos.length);
      setPhotos((p) => [...p, ...picked].slice(0, 5));
    } catch (e) {
      Alert.alert(tr('createRequest.photosErrorTitle'), (e as Error).message);
    }
  };

  const submit = async () => {
    if (!coords) return;
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
        latitude: coords.latitude,
        longitude: coords.longitude,
        address: address.trim() || undefined,
        budget_max: budget,
        payment_method: payment,
        answers: Object.entries(answers)
          .filter(([, v]) => v.trim() !== '')
          .map(([id, v]) => ({ question_id: Number(id), answer: v.trim() })),
        urgency,
        reception_type: reception,
        entry_code: reception === ReceptionType.EntryCode ? entryCode.trim() || undefined : undefined,
        availabilities: urgency === RequestUrgency.Scheduled ? availabilities : undefined,
        media_ids: mediaIds,
      });

      router.replace(`/request/${req.id}`);
    } catch (e) {
      Alert.alert(tr('common.error'), e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  const titles = [
    tr('createRequest.wizProblemTitle'),
    tr('createRequest.wizPhotosTitle'),
    tr('createRequest.wizLocationTitle'),
    tr('createRequest.wizWhenTitle'),
    tr('createRequest.wizMoneyTitle'),
    tr('createRequest.wizReviewTitle'),
  ];
  const subs = [
    tr('createRequest.wizProblemSub'),
    tr('createRequest.wizPhotosSub'),
    tr('createRequest.wizLocationSub'),
    tr('createRequest.wizWhenSub'),
    tr('createRequest.wizMoneySub'),
    tr('createRequest.wizReviewSub'),
  ];
  const canContinue =
    (step === 1 && description.trim().length >= 5 && (assetType == null || assetId != null)) ||
    step === 2 || // photos optional
    (step === 3 && !!coords) ||
    (step === 4 && (urgency === RequestUrgency.Urgent || availabilities.length > 0)) ||
    step === 5; // budget/payment have defaults

  const footer =
    step < TOTAL
      ? { primary: { label: tr('common.continue'), onPress: () => setStep(step + 1), disabled: !canContinue }, back: step > 1 ? () => setStep(step - 1) : undefined }
      : { slide: { label: tr('createRequest.slideRequest'), doneLabel: tr('createRequest.slideRequested'), onConfirm: submit, disabled: create.isPending }, back: () => setStep(step - 1) };

  const accessLabel = reception === ReceptionType.EntryCode
    ? `${tr('enums.receptionType.entry_code')}${entryCode.trim() ? ` · ${entryCode.trim()}` : ''}`
    : tr('enums.receptionType.adult_key');

  return (
    <Wiz
      cat={category?.name ?? tr('createRequest.title')}
      step={step}
      total={TOTAL}
      title={titles[step - 1]}
      sub={subs[step - 1]}
      onBack={() => (step === 1 ? router.back() : setStep(step - 1))}
      footer={footer}
    >
      {/* STEP 1 — details (asset + description + questions) */}
      {step === 1 && (
        <>
          <Row style={{ gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <CategoryIcon category={category} size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="800" style={{ fontSize: 15.5 }}>
                {category ? `${tr(`enums.categoryType.${category.type}`)} · ${category.name}` : tr('createRequest.title')}
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
            />
          )}
          <Field label={tr('createRequest.whatHappened')} value={description} onChangeText={setDescription} placeholder={tr('createRequest.whatHappenedPlaceholder')} multiline voiceInput style={{ height: 84, textAlignVertical: 'top' }} />
          {questions.length > 0 && (
            <>
              <SectionLabel>{tr('createRequest.detailsLabel')}</SectionLabel>
              <DynamicFields
                questions={questions}
                values={answers}
                onChange={(id, value) => setAnswers((s) => ({ ...s, [id]: value }))}
              />
            </>
          )}
        </>
      )}

      {/* STEP 2 — photos (optional) */}
      {step === 2 && (
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

      {/* STEP 3 — location & access */}
      {step === 3 && (
        <>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {coords ? (
              <MapView style={{ height: 200 }} region={{ latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
                <Marker coordinate={{ latitude: coords.latitude, longitude: coords.longitude }} pinColor={t.colors.accent} />
              </MapView>
            ) : (
              <Pressable onPress={locate} style={{ height: 200, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon name="location" size={28} color={t.colors.accent} />
                <Text weight="700" color={t.colors.accent}>{locating ? tr('createRequest.locating') : tr('createRequest.useLocation')}</Text>
              </Pressable>
            )}
            <Row style={{ padding: 14 }}>
              <Icon name="location" size={18} color={t.colors.accent} />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600' }}>{coords ? tr('createRequest.gpsCaptured') : tr('createRequest.tapLocation')}</Text>
              {coords && <Icon name="check" size={18} color={t.colors.ok} />}
            </Row>
          </Card>
          <Field label={tr('createRequest.addressLabel')} value={address} onChangeText={setAddress} placeholder={tr('createRequest.addressPlaceholder')} />
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
      )}

      {/* STEP 4 — when */}
      {step === 4 && (
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
            <Row style={{ gap: 12, backgroundColor: t.colors.accentSoft, borderRadius: 14, padding: 14 }}>
              <Icon name="flash" size={20} color={t.colors.accent} fill="current" />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '700' }} color={t.colors.accent}>{tr('createRequest.urgentNow')}</Text>
            </Row>
          ) : (
            <Scheduler onChange={setAvailabilities} />
          )}
        </>
      )}

      {/* STEP 5 — budget & payment */}
      {step === 5 && (
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
                {tr('createRequest.budgetInfo', { work: category?.name ?? tr('createRequest.thisJob'), avg, value, chance: tr(`createRequest.chance.${word}`) })}
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

      {/* STEP 6 — review (read-only synthesis) */}
      {step === 6 && (
        <Card>
          <SumRow icon="list" k={tr('createRequest.summaryService')} v={category?.name ?? '—'} onPress={() => setStep(1)} />
          {selectedAsset && (
            <SumRow
              icon={ICON[selectedAsset.type] ?? 'car'}
              k={tr(`assets.type.${selectedAsset.type}`)}
              v={[selectedAsset.nickname, assetCaption(selectedAsset, tr)].filter(Boolean).join(' · ')}
              onPress={() => setStep(1)}
            />
          )}
          {description.trim() !== '' && (
            <SumRow icon="edit" k={tr('createRequest.summaryDescription')} v={description.trim()} onPress={() => setStep(1)} />
          )}
          {questions
            .filter((q) => (answers[q.id] ?? '').trim() !== '')
            .map((q) => <SumRow key={q.id} icon="check" k={q.label} v={answers[q.id]} onPress={() => setStep(1)} />)}
          <SumRow icon="camera" k={tr('createRequest.photos')} v={tr('createRequest.summaryPhotos', { count: photos.length })} onPress={() => setStep(2)} />
          <SumRow icon="location" k={tr('createRequest.addressLabel')} v={address || tr('createRequest.gpsCaptured')} onPress={() => setStep(3)} />
          <SumRow icon="key" k={tr('createRequest.accessLabel')} v={accessLabel} onPress={() => setStep(3)} />
          <SumRow
            icon="calendar"
            k={tr('createRequest.when')}
            v={urgency === RequestUrgency.Urgent ? tr('enums.urgency.urgent') : tr('createRequest.windowsCount', { count: availabilities.length })}
            onPress={() => setStep(4)}
          />
          <SumRow icon="dollar" k={tr('createRequest.summaryBudget')} v={`${tr('common.currency')} ${budget}`} onPress={() => setStep(5)} />
          <SumRow icon={payment} k={tr('createRequest.summaryPayment')} v={tr(`payment.${payment}`)} onPress={() => setStep(5)} last />
        </Card>
      )}
    </Wiz>
  );
}

function SumRow({ icon, k, v, onPress, last }: { icon: string; k: string; v: string; onPress?: () => void; last?: boolean }) {
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
