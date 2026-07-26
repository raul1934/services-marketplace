import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, Avatar, BackBar, Icon, Row, Sheet, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';
import { CatalogItem, Crew, fieldApi, OsPhoto, Service, WeatherType } from '../../../src/field/api';
import { ErrorState, Loading, useAsync } from '../../../src/field/async';
import { distanceMeters, useMyLocation } from '../../../src/location';
import { capturePhoto } from '../../../src/photos';
import { WEATHER_TYPES, weatherOf } from '../../../src/weather';

export default function OS() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const siteId = id ?? 'rio-fortore';
  const { data: os, loading, error, reload, setData } = useAsync(() => fieldApi.os(siteId), [siteId]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const me = useMyLocation();
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null);
  const [viewer, setViewer] = useState<{ photos: OsPhoto[]; index: number } | null>(null);
  const [weatherOpen, setWeatherOpen] = useState(false);
  const [assigneeFor, setAssigneeFor] = useState<Service | null>(null);
  const [addForOp, setAddForOp] = useState<Crew | null>(null);

  const pickWeather = async (type: WeatherType) => {
    setWeatherOpen(false);
    try {
      setData(await fieldApi.setWeather(siteId, type));
    } catch {
      reload();
    }
  };

  // Within the site's geofence? (~150 m). null while there's no fix yet.
  const inside = me && os?.site.geo ? distanceMeters(me, os.site.geo) <= 150 : null;

  const shootPhoto = async (phase: 'before' | 'after') => {
    try {
      const p = await capturePhoto();
      if (!p) return;
      setUploading(phase);
      setData(await fieldApi.attachPhoto(siteId, phase, p));
    } catch (e) {
      Alert.alert(tr('field.photoError'), e instanceof ApiError ? e.message : String((e as Error)?.message ?? e));
      reload();
    } finally {
      setUploading(null);
    }
  };

  const toggle = async (svc: Service) => {
    const next = !svc.done;
    setData((prev) => (prev ? { ...prev, services: prev.services.map((s) => (s.id === svc.id ? { ...s, done: next } : s)) } : prev));
    try {
      setData(await fieldApi.toggleService(siteId, svc.id, next));
    } catch {
      reload();
    }
  };

  // Add a catalog service. From an operator's own button it's also assigned to
  // them; from the solo/global button it just lands (defaults to the operator).
  const addFromCatalog = async (c: CatalogItem) => {
    const op = addForOp;
    setPickerOpen(false);
    setAddForOp(null);
    try {
      const added = await fieldApi.addCatalog(siteId, c.id);
      setData(op ? await fieldApi.assignService(siteId, `${siteId}:${c.id}`, op.shiftId) : added);
    } catch {
      reload();
    }
  };

  const assign = async (svc: Service, op: Crew) => {
    setAssigneeFor(null);
    setData((prev) => (prev ? { ...prev, services: prev.services.map((s) => (s.id === svc.id ? { ...s, assignee: op.who, assigneeName: op.tech } : s)) } : prev));
    try {
      setData(await fieldApi.assignService(siteId, svc.id, op.shiftId));
    } catch {
      reload();
    }
  };

  const site = os?.site;
  // Solo shift → every service is the current operator's, shown as a flat list.
  // Crew → services group under the operator they belong to. The in-field
  // assignee wins; with none, a service falls to its usual `who` IF that person
  // is on the shift, otherwise to the current operator (never a phantom group).
  const crew = os?.crew ?? [];
  const soloShift = crew.length <= 1;
  const currentOp = crew[0];
  const effAssignee = (s: Service): { who: string; name: string } => {
    if (s.assignee) return { who: s.assignee, name: s.assigneeName ?? s.who };
    const usual = crew.find((c) => c.tech === s.whoName);
    if (usual) return { who: usual.who, name: usual.tech };
    return { who: currentOp?.who ?? s.who, name: currentOp?.tech ?? s.whoName };
  };
  const openAdd = (op: Crew | null) => { setAddForOp(op); setPickerOpen(true); };

  const serviceCard = (s: Service) => {
    const a = effAssignee(s);
    const meta = `${s.obrig ? tr('field.obrig') : tr('field.optional')} · ${s.done ? tr('field.statusDone').toLowerCase() : tr('field.statusDoing').toLowerCase()}`;
    return (
      <Pressable
        key={s.id}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: s.done }}
        accessibilityLabel={s.name}
        onPress={() => toggle(s)}
        style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: s.done ? t.colors.line : t.colors.accent, borderRadius: 12, paddingBottom: s.nest.length ? 6 : 0 }}
      >
        <Row gap={10} style={{ paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' }}>
          <Check on={s.done} />
          <View style={{ flex: 1 }}>
            <Text weight="700" style={{ fontSize: 13.5 }}>{s.name}</Text>
            {soloShift ? (
              <Row gap={5} style={{ alignItems: 'center' }}>
                <Avatar name={a.who} size={16} />
                <Text variant="caption">{a.name} · {meta}</Text>
              </Row>
            ) : (
              // Crew: the assignee is tappable to reassign the service.
              <Pressable accessibilityRole="button" accessibilityLabel={tr('field.assignTo')} onPress={() => setAssigneeFor(s)} hitSlop={6}>
                <Row gap={5} style={{ alignItems: 'center' }}>
                  <Avatar name={a.who} size={16} />
                  <Text variant="caption" color={t.colors.accent}>{a.name}</Text>
                  <Icon name="edit" size={11} color={t.colors.accent} />
                  <Text variant="caption">· {meta}</Text>
                </Row>
              </Pressable>
            )}
          </View>
          <Text style={{ fontSize: 10.5, fontWeight: '700' }} color={t.colors.ink2}>{s.rate === 'hour' ? tr('field.rateHour') : tr('field.rateVisit')}</Text>
        </Row>
        {s.nest.length ? (
          <View style={{ marginLeft: 40, marginRight: 12, borderLeftWidth: 2, borderLeftColor: t.colors.line, paddingLeft: 11, gap: 6, paddingBottom: 6 }}>
            {s.nest.map((n, i) => (
              <Row key={i} gap={8} style={{ alignItems: 'center' }}>
                <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 11 }}>{n.icon}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 12.5 }} color={t.colors.ink2}>
                  <Text weight="600" style={{ fontSize: 12.5 }}>{n.label}</Text>{n.sub ? ` · ${n.sub}` : ''}
                </Text>
                <Text style={{ fontSize: 10.5, fontWeight: n.tone ? '700' : '400' }} color={n.tone === 'charge' ? t.colors.warn : n.tone === 'free' ? t.colors.ok : t.colors.ink3}>{n.value}</Text>
              </Row>
            ))}
          </View>
        ) : null}
      </Pressable>
    );
  };

  // Crew view: one section per operator on the shift (leader first), each with
  // the services assigned to them — empty operators still get a section so they
  // have an "add service" button.
  const crewGroups = (services: Service[]) =>
    crew.map((c) => ({ crew: c, services: services.filter((s) => effAssignee(s).name === c.tech) }));

  // The dashed "add a catalog service" button (per operator, or global for solo).
  const addServiceButton = (op: Crew | null, key?: string) =>
    os && os.catalog.length ? (
      <Pressable key={key} accessibilityRole="button" accessibilityLabel={tr('field.addService')} onPress={() => openAdd(op)} style={{ borderWidth: 1.5, borderColor: t.colors.line, borderStyle: 'dashed', borderRadius: 11, paddingVertical: 11, alignItems: 'center' }}>
        <Text weight="700" style={{ fontSize: 13 }} color={t.colors.accent}>{tr('field.addService')}</Text>
      </Pressable>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <BackBar title={site?.name ?? tr('fieldNav.sites')} onBack={() => router.back()} backLabel={tr('field.back')} />
      </SafeAreaView>

      {loading ? <Loading /> : error || !os || !site ? <ErrorState error={error ?? new Error()} onRetry={reload} /> : (
        <>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="caption" style={{ flex: 1 }}>{tr('field.contract', { name: site.contract })} · {site.address}</Text>
                <Row style={{ marginLeft: 8 }}>
                  {os.presence.map((a, i) => (
                    <View key={a + i} style={{ marginLeft: i === 0 ? 0 : -8, borderWidth: 2, borderColor: t.colors.bg, borderRadius: 999 }}>
                      <Avatar name={a} size={26} />
                    </View>
                  ))}
                </Row>
              </Row>
              <Row gap={12} style={{ alignItems: 'center' }}>
                <Row gap={6} style={{ alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: inside === null ? t.colors.ink3 : inside ? t.colors.ok : t.colors.warn }} />
                  <Text variant="caption" color={inside === null ? t.colors.ink3 : inside ? t.colors.ok : t.colors.warn}>
                    {inside === null ? tr('field.locating') : inside ? tr('field.inGeofence') : tr('field.outGeofence')}
                  </Text>
                </Row>
                <Text variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
                  {tr('field.durSite')} {os.durations.siteMinutes ?? '—'} min · {tr('field.durShift')} {os.durations.shiftMinutes ?? '—'} min
                </Text>
              </Row>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tr('field.weather')}
              onPress={() => setWeatherOpen(true)}
              style={{ backgroundColor: t.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: t.colors.line, padding: 12 }}
            >
              <Row gap={11} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 22 }}>{os.weather.type ? weatherOf(os.weather.type)?.icon : '🌡️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text weight="700" style={{ fontSize: 14 }}>{os.weather.type ? weatherOf(os.weather.type)?.label : tr('field.setWeather')}</Text>
                  <Text variant="caption">{tr('field.weather')}{os.weather.temp != null ? ` · ${os.weather.temp}°C` : ''}</Text>
                </View>
                <Icon name="chevronsR" size={16} color={t.colors.ink3} />
              </Row>
            </Pressable>

            <View style={{ gap: 10 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="label">{tr('field.photos')}</Text>
                <Text variant="caption">{os.photos.before.length + os.photos.after.length}/{PHOTO_MAX}</Text>
              </Row>
              <PhotoRow label={tr('field.before')} photos={os.photos.before} busy={uploading === 'before'} canAdd={os.photos.before.length + os.photos.after.length < PHOTO_MAX} onAdd={() => shootPhoto('before')} onOpen={(i) => setViewer({ photos: os.photos.before, index: i })} />
              <PhotoRow label={tr('field.after')} photos={os.photos.after} busy={uploading === 'after'} canAdd={os.photos.before.length + os.photos.after.length < PHOTO_MAX} onAdd={() => shootPhoto('after')} onOpen={(i) => setViewer({ photos: os.photos.after, index: i })} />
            </View>

            <View style={{ gap: 9 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="label">{tr('field.visitServices')}</Text>
                <Text variant="caption">{tr('field.selected', { n: os.services.filter((s) => s.done).length, total: os.services.length })}</Text>
              </Row>

              {soloShift ? (
                <>
                  {os.services.map((s) => serviceCard(s))}
                  {addServiceButton(null)}
                </>
              ) : (
                crewGroups(os.services).map((g) => (
                  <View key={g.crew.shiftId} style={{ gap: 8, marginTop: 2 }}>
                    <Row gap={8} style={{ alignItems: 'center' }}>
                      <Avatar name={g.crew.who} size={22} />
                      <Text weight="700" style={{ fontSize: 13 }}>{g.crew.tech}</Text>
                      <Text variant="caption">· {tr('field.selected', { n: g.services.filter((s) => s.done).length, total: g.services.length })}</Text>
                    </Row>
                    {g.services.map((s) => serviceCard(s))}
                    {addServiceButton(g.crew, `add-${g.crew.shiftId}`)}
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.colors.line, backgroundColor: t.colors.surface }}>
            <SlideToConfirm label={tr('field.finishOS')} doneLabel={tr('field.finishedOS')} confirmHint={tr('field.finishHint')} onConfirm={() => fieldApi.finishSite(siteId).catch(() => {}).finally(() => router.back())} />
          </SafeAreaView>

          <Sheet visible={pickerOpen} onClose={() => { setPickerOpen(false); setAddForOp(null); }} title={addForOp ? tr('field.addServiceFor', { name: addForOp.tech }) : tr('field.addServiceTitle')} closeLabel={tr('common.close')} maxHeight="72%">
            <Text variant="caption" style={{ marginBottom: 10 }}>{addForOp ? tr('field.catalogHintFor', { name: addForOp.tech }) : tr('field.catalogHint')}</Text>
            <View style={{ gap: 8 }}>
              {os.catalog.map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={c.name}
                  onPress={() => addFromCatalog(c)}
                  style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, padding: 13 }}
                >
                  <Row gap={10} style={{ alignItems: 'center' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="wrench" size={17} color={t.colors.ink3} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text weight="600" style={{ fontSize: 13.5 }}>{c.name}</Text>
                      <Text variant="caption">{c.obrig ? tr('field.obrig') : tr('field.optional')} · {c.rate === 'hour' ? tr('field.rateHour') : tr('field.rateVisit')}</Text>
                    </View>
                    <Icon name="plus" size={18} color={t.colors.accent} />
                  </Row>
                </Pressable>
              ))}
            </View>
          </Sheet>

          <Sheet visible={weatherOpen} onClose={() => setWeatherOpen(false)} title={tr('field.weather')} closeLabel={tr('common.close')}>
            <View style={{ gap: 8 }}>
              {WEATHER_TYPES.map((w) => (
                <Pressable
                  key={w.type}
                  accessibilityRole="button"
                  accessibilityLabel={w.label}
                  onPress={() => pickWeather(w.type)}
                  style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: os.weather.type === w.type ? t.colors.accent : t.colors.line, borderRadius: 12, padding: 13 }}
                >
                  <Row gap={11} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{w.icon}</Text>
                    <Text weight="700" style={{ flex: 1, fontSize: 14.5 }}>{w.label}</Text>
                    {os.weather.type === w.type ? <Icon name="check" size={18} color={t.colors.accent} /> : null}
                  </Row>
                </Pressable>
              ))}
            </View>
          </Sheet>

          <Sheet visible={!!assigneeFor} onClose={() => setAssigneeFor(null)} title={tr('field.assignTo')} closeLabel={tr('common.close')}>
            <View style={{ gap: 8 }}>
              {os.crew.map((c) => {
                const chosen = assigneeFor ? effAssignee(assigneeFor).name === c.tech : false;
                return (
                  <Pressable
                    key={c.shiftId}
                    accessibilityRole="button"
                    accessibilityLabel={c.tech}
                    onPress={() => assigneeFor && assign(assigneeFor, c)}
                    style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: chosen ? t.colors.accent : t.colors.line, borderRadius: 12, padding: 12 }}
                  >
                    <Row gap={11} style={{ alignItems: 'center' }}>
                      <Avatar name={c.who} size={30} />
                      <Text weight="700" style={{ flex: 1, fontSize: 14.5 }}>{c.tech}</Text>
                      {chosen ? <Icon name="check" size={18} color={t.colors.accent} /> : null}
                    </Row>
                  </Pressable>
                );
              })}
            </View>
          </Sheet>

          {viewer ? <PhotoViewer photos={viewer.photos} index={viewer.index} onClose={() => setViewer(null)} /> : null}
        </>
      )}
    </View>
  );
}

const PHOTO_MAX = 15;
const GRID_COLS = 3;
const GRID_GAP = 8;
const GRID_SIZE = (Dimensions.get('window').width - 40 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

/** One phase's photos (Antes/Depois) as a 3-per-row grid, in capture order. */
function PhotoRow({ label, photos, busy, canAdd, onAdd, onOpen }: { label: string; photos: OsPhoto[]; busy: boolean; canAdd: boolean; onAdd: () => void; onOpen: (i: number) => void }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View style={{ gap: 6 }}>
      <Text weight="700" style={{ fontSize: 12.5 }} color={t.colors.ink2}>{label} · {photos.length}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}>
        {photos.map((p, i) => (
          <Pressable key={p.mediaId ?? i} accessibilityRole="imagebutton" accessibilityLabel={`${label} ${i + 1}`} onPress={() => onOpen(i)} style={{ width: GRID_SIZE, height: GRID_SIZE, borderRadius: 11, overflow: 'hidden', backgroundColor: '#46586a' }}>
            <Image source={{ uri: p.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <Text style={{ fontSize: 10, fontWeight: '700' }} color="#fff">{i + 1} · {p.at}</Text>
            </View>
          </Pressable>
        ))}
        {canAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${tr('field.addPhoto')} · ${label}`}
            onPress={onAdd}
            disabled={busy}
            style={{ width: GRID_SIZE, height: GRID_SIZE, borderRadius: 11, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center', gap: 3 }}
          >
            {busy ? <ActivityIndicator color={t.colors.accent} /> : (
              <>
                <Icon name="plus" size={20} color={t.colors.ink3} />
                <Text variant="caption">{tr('field.addPhoto')}</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** Full-screen swipeable viewer: browse a phase's photos in order, with info. */
function PhotoViewer({ photos, index, onClose }: { photos: OsPhoto[]; index: number; onClose: () => void }) {
  const { t: tr } = useTranslation();
  const width = Dimensions.get('window').width;
  const [i, setI] = useState(index);
  const cur = photos[i];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' }}>
        <SafeAreaView edges={['top']} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text weight="700" style={{ fontSize: 15, color: '#fff' }}>{i + 1} / {photos.length}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={tr('common.close')} onPress={onClose} hitSlop={12}>
            <Icon name="close" size={24} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: index * width, y: 0 }}
          onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flex: 1 }}
        >
          {photos.map((p, k) => (
            <View key={p.mediaId ?? k} style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Image source={{ uri: p.url }} style={{ width, height: '100%' }} resizeMode="contain" />
            </View>
          ))}
        </ScrollView>
        <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          <Text weight="800" style={{ fontSize: 15, color: '#fff' }}>{tr('field.photoNum', { n: i + 1 })}</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{cur?.takenAt ? new Date(cur.takenAt).toLocaleString('pt-BR') : cur?.at}</Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Check({ on }: { on: boolean }) {
  const t = useTheme();
  return (
    <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: on ? 0 : 1.5, borderColor: t.colors.line, backgroundColor: on ? t.colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {on ? <Icon name="check" size={14} color="#fff" /> : null}
    </View>
  );
}
