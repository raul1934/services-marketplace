import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Chip,
  Field,
  Icon,
  JobPart,
  PART_ACTIONS,
  PartAction,
  Price,
  RequestStatus,
  Row,
  Screen,
  BackBar,
  SectionLabel,
  Text,
  brl,
  calcPayout,
  relativeParts,
  PLATFORM_FEE_RATE,
  useAuth,
  useTheme,
} from '@chamafacil/shared';
import {
  useAttachJobMedia,
  useAddPart,
  useAddUpdate,
  useDeletePart,
  useJob,
  useJobReport,
  useRecordOdometer,
  useRequestApproval,
} from '../../../src/queries';
import { pickPhotos, uploadPhotos } from '../../../src/photos';

/**
 * Job worklog (Screen B): the data-entry half of an active job — before/after
 * photos, parts & materials, the payout breakdown and client notes. Split out
 * of the job screen so the "advance the job" control (Screen A) stays clean and
 * the provider isn't scrolling past an inventory form to reach the slider.
 */
export default function WorklogScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr, i18n } = useTranslation();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading } = useJob(requestId);
  const { updates, parts } = useJobReport(requestId);
  const requestApproval = useRequestApproval(requestId);
  const addUpdate = useAddUpdate(requestId);
  const addPart = useAddPart(requestId);
  const deletePart = useDeletePart(requestId);
  const recordOdometer = useRecordOdometer(requestId);

  const [note, setNote] = useState('');
  const [partSheet, setPartSheet] = useState(false);
  const [partName, setPartName] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [partPrice, setPartPrice] = useState('');
  const [partAction, setPartAction] = useState<PartAction>(PartAction.Added);
  const [odoSheet, setOdoSheet] = useState(false);
  const [odoKm, setOdoKm] = useState('');
  const [odoNote, setOdoNote] = useState('');

  if (isLoading || !request) {
    return (
      <Screen stickyHeader scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.colors.accent} size="large" />
      </Screen>
    );
  }

  const status = request.status;
  const partsList = parts.data ?? [];
  const labor = request.accepted_proposal?.price ?? 0;
  const partsTotal = partsList.reduce((s, p) => s + (p.unit_price ?? 0) * p.quantity, 0);
  const feeRate = user?.provider_profile?.commission_rate ?? PLATFORM_FEE_RATE;
  const feePctNum = feeRate * 100;
  const feePct = (Number.isInteger(feePctNum) ? String(feePctNum) : feePctNum.toFixed(1)).replace('.', i18n.language.startsWith('pt') ? ',' : '.');
  const payout = calcPayout(labor + partsTotal, feeRate);

  const submitNote = () => {
    if (!note.trim()) return;
    addUpdate.mutate(note.trim(), { onSuccess: () => setNote('') });
  };
  const resetPart = () => { setPartName(''); setPartQty('1'); setPartPrice(''); setPartAction(PartAction.Added); };
  const submitPart = () => {
    if (!partName.trim()) return;
    addPart.mutate(
      { name: partName.trim(), action: partAction, quantity: Number(partQty) || 1, unit_price: partPrice ? Number(partPrice.replace(',', '.')) : undefined },
      { onSuccess: () => { resetPart(); setPartSheet(false); } },
    );
  };
  const closePartSheet = () => { resetPart(); setPartSheet(false); };

  const isVehicle = request.asset?.type === 'vehicle';
  const currentKm = request.asset?.detail?.current_mileage;
  const submitOdometer = () => {
    const value = parseInt(odoKm.replace(/\D/g, ''), 10);
    if (!value || value <= 0) return;
    recordOdometer.mutate(
      { mileage: value, note: odoNote.trim() || undefined },
      { onSuccess: () => { setOdoKm(''); setOdoNote(''); setOdoSheet(false); } },
    );
  };

  return (
    <Screen stickyHeader padded={false}>
      <BackBar backLabel={tr('common.back')}
        title={tr('job.worklogTitle')}
        onBack={() => (router.canGoBack() ? router.back() : router.replace(`/job/${requestId}`))}
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        {/* before & after photos */}
        <BeforeAfter request={request} />

        {/* odometer (vehicles) — recorded during the service, flows to the asset history */}
        {isVehicle && (
          <View style={{ gap: 10 }}>
            <SectionLabel>{tr('job.odometer')}</SectionLabel>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <View>
                  <Text variant="caption">{tr('job.currentKm')}</Text>
                  <Text weight="800" style={{ fontSize: 20 }}>
                    {currentKm != null ? `${currentKm.toLocaleString('pt-BR')} km` : '—'}
                  </Text>
                </View>
                {status !== RequestStatus.Completed && (
                  <Button title={tr('job.recordKm')} size="sm" variant="soft" onPress={() => setOdoSheet(true)} left={<Icon name="plus" size={16} color={t.colors.accent} />} />
                )}
              </Row>
            </Card>
          </View>
        )}

        {/* parts */}
        <SectionLabel count={partsList.length}>{tr('job.partsLabel')}</SectionLabel>
        {partsList.length > 0 && (
          <Card padded={false} style={{ paddingHorizontal: 16 }}>
            {partsList.map((p: JobPart, i) => (
              <Row key={p.id} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderColor: t.colors.line, gap: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Text weight="800" style={{ fontSize: 12.5 }}>{p.quantity}×</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="700" style={{ fontSize: 14 }}>{p.name}</Text>
                  <Text variant="caption">{tr(`enums.partAction.${p.action}`)} · {p.unit_price != null ? brl(p.unit_price) : '—'}</Text>
                  {p.approved_at && (
                    <Row gap={4} style={{ marginTop: 2 }}>
                      <Icon name="check" size={11} color={t.colors.ok} />
                      <Text variant="caption" weight="700" color={t.colors.ok}>{tr('job.partApproved')}</Text>
                    </Row>
                  )}
                </View>
                <Text weight="800" style={{ fontSize: 14 }}>{p.unit_price != null ? brl(p.unit_price * p.quantity) : '—'}</Text>
                <Icon name="close" size={16} color={t.colors.ink3} />
                <Text onPress={() => deletePart.mutate(p.id)} style={{ position: 'absolute', right: 0, width: 30, height: 40 }} />
              </Row>
            ))}
          </Card>
        )}

        {partsList.length === 0 && (
          <Text variant="caption" color={t.colors.ink3}>{tr('job.partsEmpty')}</Text>
        )}
        {status !== RequestStatus.Completed && (
          <Button title={tr('job.addItem')} size="sm" variant="soft" onPress={() => setPartSheet(true)} left={<Icon name="plus" size={16} color={t.colors.accent} />} />
        )}

        {/* totals */}
        <Card>
          <TotalLine k={tr('job.labor')} v={brl(labor)} />
          <TotalLine k={tr('job.partsLabel')} v={brl(partsTotal)} />
          <TotalLine k={tr('job.fee', { pct: feePct })} v={`− ${brl(payout.fee)}`} muted />
          <View style={{ height: 1, backgroundColor: t.colors.line, marginVertical: 6 }} />
          <Row>
            <Text weight="800" style={{ flex: 1 }}>{tr('job.payout')}</Text>
            <Price value={(labor + partsTotal - payout.fee).toFixed(2).replace('.', ',')} size={19} />
          </Row>
        </Card>

        {/* client approval of the running total */}
        {status === RequestStatus.InProgress && (
          request.parts_approved ? (
            <Row style={{ gap: 8, backgroundColor: t.colors.okSoft, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
              <Icon name="check" size={16} color={t.colors.ok} />
              <Text weight="700" color={t.colors.ok} style={{ fontSize: 13.5 }}>{tr('job.approved')}</Text>
            </Row>
          ) : request.parts_approval_requested ? (
            <Row style={{ gap: 8, backgroundColor: t.colors.surface2, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 13 }}>
              <Icon name="clock" size={16} color={t.colors.ink2} />
              <Text weight="700" color={t.colors.ink2} style={{ fontSize: 13.5 }}>{tr('job.approvalPending')}</Text>
            </Row>
          ) : (
            <Button
              title={tr('job.requestApproval', { value: brl(labor + partsTotal) })}
              variant="soft"
              full
              loading={requestApproval.isPending}
              onPress={() => requestApproval.mutate()}
              left={<Icon name="shieldCheck" size={16} color={t.colors.accent} />}
            />
          )
        )}

        {/* work notes */}
        <SectionLabel>{tr('job.updatesLabel')}</SectionLabel>
        {status !== RequestStatus.Completed && (
          <Row style={{ gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Field value={note} onChangeText={setNote} placeholder={tr('job.addNotePlaceholder')} voiceInput />
            </View>
            <Button title={tr('common.send')} loading={addUpdate.isPending} onPress={submitNote} />
          </Row>
        )}
        {updates.data?.map((u) => {
          const r = relativeParts(u.created_at);
          return (
            <Card key={u.id} flat style={{ gap: 2 }}>
              <Text style={{ fontSize: 14 }}>{u.body}</Text>
              <Text variant="caption">{r.unit === 'now' ? tr('time.now') : tr(`time.${r.unit}Ago`, { count: r.count })}</Text>
            </Card>
          );
        })}
      </View>

      {/* Add-item bottom sheet */}
      <Modal visible={partSheet} transparent animationType="slide" onRequestClose={closePartSheet}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={closePartSheet} />
          <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, gap: 12 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line }} />
            <Text variant="h3">{tr('job.addItemTitle')}</Text>
            <Field label={tr('job.partItem')} value={partName} onChangeText={setPartName} placeholder={tr('job.partItemPlaceholder')} autoFocus />
            <Row style={{ gap: 10, alignItems: 'stretch' }}>
              <View style={{ width: 80 }}>
                <Field label={tr('job.partQty')} value={partQty} onChangeText={setPartQty} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={tr('job.partPrice')} value={partPrice} onChangeText={setPartPrice} keyboardType="decimal-pad" placeholder="0,00" />
              </View>
            </Row>
            <Text variant="label">{tr('job.partAction')}</Text>
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {PART_ACTIONS.map((a) => (
                <Chip key={a} label={tr(`enums.partAction.${a}`)} active={partAction === a} onPress={() => setPartAction(a)} />
              ))}
            </Row>
            <Button title={tr('job.addItem')} full loading={addPart.isPending} disabled={!partName.trim()} onPress={submitPart} left={<Icon name="plus" size={18} color="#fff" />} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Odometer bottom sheet */}
      <Modal visible={odoSheet} transparent animationType="slide" onRequestClose={() => setOdoSheet(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setOdoSheet(false)} />
          <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30, gap: 12 }}>
            <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.line }} />
            <Text variant="h3">{tr('job.recordKm')}</Text>
            <Field label={tr('job.currentKm')} value={odoKm} onChangeText={setOdoKm} keyboardType="numeric" placeholder="52000" autoFocus />
            <Field label={tr('job.odometerNote')} value={odoNote} onChangeText={setOdoNote} placeholder={tr('job.odometerNotePlaceholder')} />
            <Button title={tr('job.recordKm')} full loading={recordOdometer.isPending} disabled={!odoKm.trim()} onPress={submitOdometer} left={<Icon name="plus" size={18} color="#fff" />} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

/** Provider's before/after job photos (multiple), shared with the client. */
function BeforeAfter({ request }: { request: NonNullable<ReturnType<typeof useJob>['data']> }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const attach = useAttachJobMedia(request.id);
  const done = request.status === RequestStatus.Completed;

  const pickAndUpload = async (phase: 'before' | 'after') => {
    try {
      const picked = await pickPhotos(10);
      if (!picked.length) return;
      const media = await uploadPhotos(picked); // upload-first
      attach.mutate({ phase, media_ids: media.map((m) => m.id) });
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  const column = (phase: 'before' | 'after', photos: { id: number; url: string }[]) => (
    <View style={{ flex: 1, gap: 8 }}>
      <Text variant="label" color={t.colors.ink2}>{tr(`job.${phase}Label`)}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((p) => (
          <Image key={p.id} source={{ uri: p.url }} style={{ width: 72, height: 72, borderRadius: 12 }} />
        ))}
        {!done && (
          <Pressable
            onPress={() => pickAndUpload(phase)}
            style={{ width: 72, height: 72, borderRadius: 12, borderWidth: 1.5, borderColor: t.colors.line, borderStyle: 'dashed', backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center', gap: 3 }}
          >
            <Icon name="camera" size={20} color={t.colors.accent} />
            <Text style={{ fontSize: 10.5, fontWeight: '800', color: t.colors.accent }}>{tr('job.addPhoto')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ gap: 10 }}>
      <Row>
        <SectionLabel>{tr('job.beforeAfter')}</SectionLabel>
        <View style={{ flex: 1 }} />
        <Text style={{ fontSize: 11.5, fontWeight: '700' }} color={t.colors.ink3}>{tr('job.sharedWithClient')}</Text>
      </Row>
      <Row style={{ alignItems: 'flex-start', gap: 14 }}>
        {column('before', request.before_photos ?? [])}
        {column('after', request.after_photos ?? [])}
      </Row>
    </View>
  );
}

function TotalLine({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  const t = useTheme();
  return (
    <Row style={{ paddingVertical: 7 }}>
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600' }} color={t.colors.ink2}>{k}</Text>
      <Text style={{ fontSize: 14 }} color={muted ? t.colors.ink2 : t.colors.ink}>{v}</Text>
    </Row>
  );
}
