import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar, BackBar, Icon, Row, Sheet, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';
import { CatalogItem, fieldApi, Service } from '../../../src/field/api';
import { ErrorState, Loading, useAsync } from '../../../src/field/async';

export default function OS() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const siteId = id ?? 'rio-fortore';
  const { data: os, loading, error, reload, setData } = useAsync(() => fieldApi.os(siteId), [siteId]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggle = async (svc: Service) => {
    const next = !svc.done;
    setData((prev) => (prev ? { ...prev, services: prev.services.map((s) => (s.id === svc.id ? { ...s, done: next } : s)) } : prev));
    try {
      setData(await fieldApi.toggleService(siteId, svc.id, next));
    } catch {
      reload();
    }
  };

  const addFromCatalog = async (c: CatalogItem) => {
    setPickerOpen(false);
    try {
      setData(await fieldApi.addCatalog(siteId, c.id));
    } catch {
      reload();
    }
  };

  const site = os?.site;

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
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.ok }} />
                  <Text variant="caption" color={t.colors.ok}>{tr('field.inGeofence')}</Text>
                </Row>
                <Text variant="caption" style={{ fontVariant: ['tabular-nums'] }}>{tr('field.durSite')} 11 min · {tr('field.durShift')} 50 min</Text>
              </Row>
            </View>

            <View style={{ gap: 7 }}>
              <Text variant="label">{tr('field.photos')}</Text>
              <Row gap={10}>
                <Photo label={`${tr('field.before')} · 8:22`} />
                <Photo label={`${tr('field.after')} · 8:29`} />
              </Row>
            </View>

            <View style={{ gap: 9 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="label">{tr('field.visitServices')}</Text>
                <Text variant="caption">{tr('field.selected', { n: os.services.filter((s) => s.done).length, total: os.services.length })}</Text>
              </Row>

              {os.services.map((s) => (
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
                      <Row gap={5} style={{ alignItems: 'center' }}>
                        <Avatar name={s.who} size={16} />
                        <Text variant="caption">{s.whoName} · {s.obrig ? tr('field.obrig') : tr('field.optional')} · {s.done ? tr('field.statusDone').toLowerCase() : tr('field.statusDoing').toLowerCase()}</Text>
                      </Row>
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
              ))}

              {os.catalog.length ? (
                <Pressable accessibilityRole="button" onPress={() => setPickerOpen(true)} style={{ borderWidth: 1.5, borderColor: t.colors.line, borderStyle: 'dashed', borderRadius: 11, paddingVertical: 11, alignItems: 'center' }}>
                  <Text weight="700" style={{ fontSize: 13 }} color={t.colors.accent}>{tr('field.addService')}</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.colors.line, backgroundColor: t.colors.surface }}>
            <SlideToConfirm label={tr('field.finishOS')} doneLabel={tr('field.finishedOS')} confirmHint={tr('field.finishHint')} onConfirm={() => fieldApi.finishSite(siteId).catch(() => {}).finally(() => router.back())} />
          </SafeAreaView>

          <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title={tr('field.addServiceTitle')} closeLabel={tr('common.close')} maxHeight="72%">
            <Text variant="caption" style={{ marginBottom: 10 }}>{tr('field.catalogHint')}</Text>
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
        </>
      )}
    </View>
  );
}

function Photo({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, height: 96, borderRadius: 11, overflow: 'hidden', backgroundColor: '#46586a', justifyContent: 'flex-end', padding: 8 }}>
      <Row gap={4} style={{ alignItems: 'center' }}>
        <Icon name="pin" size={11} color="#fff" />
        <Text style={{ fontSize: 10.5, fontWeight: '700' }} color="#fff">{label}</Text>
      </Row>
    </View>
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
