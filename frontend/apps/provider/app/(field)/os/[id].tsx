import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, Avatar, BackBar, Icon, Row, Sheet, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';
import { Crew, fieldApi, MenuItem, OsPhoto, ResourceItem, ResourceKind, ServiceInstance, ServiceResource, WeatherType } from '../../../src/field/api';
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
  const me = useMyLocation();
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null);
  const [viewer, setViewer] = useState<{ photos: OsPhoto[]; index: number } | null>(null);
  const [weatherOpen, setWeatherOpen] = useState(false);
  // The operator whose "add service" menu is open, its search, and the staged
  // selection (service ids) that a footer button commits on confirm.
  const [menuForOp, setMenuForOp] = useState<Crew | null>(null);
  const [menuSearch, setMenuSearch] = useState('');
  const [menuSel, setMenuSel] = useState<string[]>([]);
  // The service instance whose resource picker is open (by id), and its staged
  // resource selection (resource ids).
  const [resourcesForId, setResourcesForId] = useState<string | null>(null);
  const [resSel, setResSel] = useState<string[]>([]);

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

  const resourceValue = (r: { kind: ResourceKind; rate: ServiceResource['rate']; cost: ServiceResource['cost'] }) =>
    r.kind === 'equipment'
      ? (r.rate === 'hour' ? tr('field.rateHour') : tr('field.rateVisit'))
      : (r.cost === 'free' ? tr('field.free') : tr('field.charged'));

  // A service's required equipment/consumable, as a compact string.
  const requiredText = (req: { kind: ResourceKind; name: string }[]) =>
    req.map((r) => `${r.kind === 'equipment' ? '🔧' : '📦'} ${r.name}`).join('  ·  ');

  const site = os?.site;
  // The OS is organised by operator. Adding a service (no select/done step) puts
  // an instance under an operator; a service can appear more than once.
  const crew = os?.crew ?? [];
  const soloShift = crew.length <= 1;
  const hasResourceCatalog = !!os && (os.resourceCatalog.equipment.length > 0 || os.resourceCatalog.consumable.length > 0);
  const resourceInst = os ? os.services.find((s) => s.id === resourcesForId) ?? null : null;
  const instancesFor = (op: Crew) => (os ? os.services.filter((s) => s.assigneeName === op.tech) : []);

  // The pickers stage a selection and commit it on a footer button, instead of
  // adding item by item on tap.
  const openMenu = (op: Crew) => { setMenuForOp(op); setMenuSearch(''); setMenuSel(instancesFor(op).map((i) => i.serviceId)); };
  const confirmMenu = async () => {
    const op = menuForOp;
    if (!op) return;
    const current = instancesFor(op);
    const toAdd = menuSel.filter((id) => !current.some((i) => i.serviceId === id));
    const toRemove = current.filter((i) => !menuSel.includes(i.serviceId));
    setMenuForOp(null);
    try {
      for (const id of toAdd) await fieldApi.addService(siteId, id, op.shiftId);
      for (const inst of toRemove) await fieldApi.removeService(siteId, inst.id);
    } finally {
      reload();
    }
  };

  const openResources = (inst: ServiceInstance) => { setResourcesForId(inst.id); setResSel(inst.resources.map((r) => r.id)); };
  const confirmResources = async () => {
    const inst = resourceInst;
    if (!inst) return;
    const currentIds = inst.resources.map((r) => r.id);
    const toAdd = resSel.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !resSel.includes(id));
    setResourcesForId(null);
    try {
      for (const id of toAdd) await fieldApi.addResource(siteId, inst.id, id);
      for (const id of toRemove) await fieldApi.removeResource(siteId, inst.id, id);
    } finally {
      reload();
    }
  };

  const instanceCard = (inst: ServiceInstance) => (
    <View key={inst.id} style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, paddingBottom: inst.resources.length || hasResourceCatalog ? 6 : 0 }}>
      <Row gap={10} style={{ paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text weight="700" style={{ fontSize: 13.5 }}>{inst.name}</Text>
          <Text variant="caption">
            {inst.obrig ? tr('field.obrig') : tr('field.optional')}{inst.required.length ? `  ·  ${requiredText(inst.required)}` : ''}
          </Text>
        </View>
      </Row>
      {inst.resources.length || hasResourceCatalog ? (
        <View style={{ marginLeft: 12, marginRight: 12, borderLeftWidth: 2, borderLeftColor: t.colors.line, paddingLeft: 11, gap: 6, paddingBottom: 6 }}>
          {inst.resources.map((r) => (
            <Row key={r.id} gap={8} style={{ alignItems: 'center' }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 11 }}>{r.kind === 'equipment' ? '🔧' : '📦'}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 12.5 }} color={t.colors.ink2}>
                <Text weight="600" style={{ fontSize: 12.5 }}>{r.name}</Text>{` · ${r.kind === 'equipment' ? tr('field.equipment') : tr('field.consumable')}`}{r.qty > 1 ? ` ×${r.qty}` : ''}
              </Text>
              <Text style={{ fontSize: 10.5, fontWeight: r.kind === 'consumable' ? '700' : '400' }} color={r.kind === 'consumable' ? (r.cost === 'charged' ? t.colors.warn : t.colors.ok) : t.colors.ink3}>{resourceValue(r)}</Text>
            </Row>
          ))}
          {hasResourceCatalog ? (
            <Pressable accessibilityRole="button" accessibilityLabel={tr('field.addResource')} onPress={() => openResources(inst)} style={{ alignSelf: 'flex-start', paddingVertical: 3 }}>
              <Text weight="700" style={{ fontSize: 12 }} color={t.colors.accent}>{tr('field.addResource')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  const addServiceButton = (op: Crew, key?: string) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityLabel={tr('field.addService')}
      onPress={() => openMenu(op)}
      style={{ borderWidth: 1.5, borderColor: t.colors.line, borderStyle: 'dashed', borderRadius: 11, paddingVertical: 11, alignItems: 'center' }}
    >
      <Text weight="700" style={{ fontSize: 13 }} color={t.colors.accent}>{tr('field.addService')}</Text>
    </Pressable>
  );

  // The "add service" menu: search + a Mandatory group, then the rest.
  const renderServiceMenu = () => {
    if (!os || !menuForOp) return null;
    const q = menuSearch.trim().toLowerCase();
    const filtered = os.serviceMenu.filter((m) => !q || m.name.toLowerCase().includes(q));
    const mandatory = filtered.filter((m) => m.obrig);
    const others = filtered.filter((m) => !m.obrig);
    // A service can go to several operators, but only once each. The menu stages
    // the selection locally; a footer button commits it.
    const menuRow = (m: MenuItem) => {
      const added = menuSel.includes(m.id);
      return (
        <Pressable
          key={m.id}
          accessibilityRole="button"
          accessibilityState={{ selected: added }}
          accessibilityLabel={m.name}
          onPress={() => setMenuSel((prev) => (prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]))}
          style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: added ? t.colors.accent : t.colors.line, borderRadius: 11, padding: 11 }}
        >
          <Row gap={10} style={{ alignItems: 'center' }}>
            <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="wrench" size={17} color={t.colors.ink3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text weight="600" style={{ fontSize: 13.5 }}>{m.name}</Text>
              <Text variant="caption">{m.required.length ? requiredText(m.required) : (m.rate === 'hour' ? tr('field.rateHour') : tr('field.rateVisit'))}</Text>
            </View>
            <Icon name={added ? 'check' : 'plus'} size={18} color={t.colors.accent} />
          </Row>
        </Pressable>
      );
    };

    return (
      <>
        <TextInput
          value={menuSearch}
          onChangeText={setMenuSearch}
          placeholder={tr('field.searchService')}
          placeholderTextColor={t.colors.ink3}
          accessibilityLabel={tr('field.searchService')}
          style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: t.colors.ink, marginBottom: 10 }}
        />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
          {mandatory.length ? (
            <View style={{ gap: 6, marginBottom: 12 }}>
              <Text variant="label">{tr('field.mandatory')}</Text>
              {mandatory.map(menuRow)}
            </View>
          ) : null}
          {others.length ? (
            <View style={{ gap: 6 }}>
              <Text variant="label">{tr('field.others')}</Text>
              {others.map(menuRow)}
            </View>
          ) : null}
          {!filtered.length ? <Text variant="caption" style={{ paddingVertical: 12 }}>{tr('field.noResults')}</Text> : null}
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tr('field.confirmAdd')}
          onPress={confirmMenu}
          style={{ backgroundColor: t.colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 }}
        >
          <Text weight="800" style={{ fontSize: 15, color: '#fff' }}>{tr('field.confirmAdd')}</Text>
        </Pressable>
      </>
    );
  };

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
                <Text variant="caption">{tr('field.servicesTotal', { n: os.services.length })}</Text>
              </Row>

              {soloShift ? (
                <>
                  {crew[0] ? instancesFor(crew[0]).map(instanceCard) : null}
                  {crew[0] ? addServiceButton(crew[0]) : null}
                </>
              ) : (
                crew.map((c) => (
                  <View key={c.shiftId} style={{ gap: 8, marginTop: 2 }}>
                    <Row gap={8} style={{ alignItems: 'center' }}>
                      <Avatar name={c.who} size={22} />
                      <Text weight="700" style={{ fontSize: 13 }}>{c.tech}</Text>
                      <Text variant="caption">· {instancesFor(c).length}</Text>
                    </Row>
                    {instancesFor(c).map(instanceCard)}
                    {addServiceButton(c, `add-${c.shiftId}`)}
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.colors.line, backgroundColor: t.colors.surface }}>
            <SlideToConfirm label={tr('field.finishOS')} doneLabel={tr('field.finishedOS')} confirmHint={tr('field.finishHint')} onConfirm={() => fieldApi.finishSite(siteId).catch(() => {}).finally(() => router.back())} />
          </SafeAreaView>

          <Sheet visible={!!menuForOp} onClose={() => setMenuForOp(null)} title={menuForOp ? tr('field.addServiceFor', { name: menuForOp.tech }) : tr('field.addServiceTitle')} closeLabel={tr('common.close')} maxHeight="82%">
            {renderServiceMenu()}
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

          <Sheet visible={!!resourceInst} onClose={() => setResourcesForId(null)} title={tr('field.resourcesTitle')} closeLabel={tr('common.close')} maxHeight="82%">
            {resourceInst ? (
              <>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                <Text variant="caption" style={{ marginBottom: 10 }}>{resourceInst.name}</Text>
                {(['equipment', 'consumable'] as ResourceKind[]).map((kind) => {
                  const groups = os.resourceCatalog[kind];
                  if (!groups.length) return null;
                  return (
                    <View key={kind} style={{ gap: 8, marginBottom: 14 }}>
                      <Text variant="label">{kind === 'equipment' ? tr('field.equipmentSection') : tr('field.consumableSection')}</Text>
                      {groups.map((g) => (
                        <View key={g.category} style={{ gap: 6 }}>
                          <Text variant="caption" style={{ marginTop: 2 }}>{g.category}</Text>
                          {g.items.map((item) => {
                            const on = resSel.includes(item.id);
                            return (
                              <Pressable
                                key={item.id}
                                accessibilityRole="button"
                                accessibilityState={{ selected: on }}
                                accessibilityLabel={item.name}
                                onPress={() => setResSel((prev) => (prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]))}
                                style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: on ? t.colors.accent : t.colors.line, borderRadius: 11, padding: 11 }}
                              >
                                <Row gap={10} style={{ alignItems: 'center' }}>
                                  <Text style={{ fontSize: 17 }}>{kind === 'equipment' ? '🔧' : '📦'}</Text>
                                  <Text weight="600" style={{ flex: 1, fontSize: 13.5 }}>{item.name}</Text>
                                  <Text style={{ fontSize: 10.5, fontWeight: item.kind === 'consumable' ? '700' : '400' }} color={item.kind === 'consumable' ? (item.cost === 'charged' ? t.colors.warn : t.colors.ok) : t.colors.ink3}>{resourceValue(item)}</Text>
                                  <Icon name={on ? 'check' : 'plus'} size={17} color={t.colors.accent} />
                                </Row>
                              </Pressable>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  );
                })}
                </ScrollView>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tr('field.confirmAdd')}
                  onPress={confirmResources}
                  style={{ backgroundColor: t.colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 }}
                >
                  <Text weight="800" style={{ fontSize: 15, color: '#fff' }}>{tr('field.confirmAdd')}</Text>
                </Pressable>
              </>
            ) : null}
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
