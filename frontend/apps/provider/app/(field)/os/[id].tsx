import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar, BackBar, Icon, Row, Sheet, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';

const SITE_NAMES: Record<string, string> = {
  'rio-fortore': 'Cond. Rio Fortore',
  solar: 'Ed. Solar das Palmeiras',
  villa: 'Cond. Villa Toscana',
  anavec: 'Ed. Anavec',
};

type Nest = { icon: string; label: string; sub: string; value: string; tone?: 'charge' | 'free' };
type Svc = { id: string; name: string; who: string; whoName: string; rate: 'visit' | 'hour'; done: boolean; obrig: boolean; live?: boolean; nest: Nest[] };

const SERVICES: Svc[] = [
  {
    id: 'bomba', name: "Bomba d'água — preventiva", who: 'AN', whoName: 'Você', rate: 'visit', done: true, obrig: true,
    nest: [
      { icon: '🔧', label: 'Multímetro', sub: 'equipamento', value: '1h' },
      { icon: '📦', label: 'Pressostato', sub: 'material', value: 'cobra à parte', tone: 'charge' },
      { icon: '✓', label: 'Checklist da bomba', sub: '', value: '2/2' },
    ],
  },
  {
    id: 'quadro', name: 'Quadro elétrico — revisão', who: 'BR', whoName: 'Bruno', rate: 'hour', done: true, obrig: true,
    nest: [{ icon: '🔧', label: 'Alicate-amperímetro', sub: 'equipamento', value: '1,5h' }],
  },
  {
    id: 'portao', name: 'Portão automático — lubrificação', who: 'CA', whoName: 'Carla', rate: 'visit', done: false, obrig: false,
    nest: [{ icon: '📦', label: 'Graxa', sub: 'material', value: 'sem custo', tone: 'free' }],
  },
];

type CatalogItem = { id: string; name: string; rate: 'visit' | 'hour'; obrig: boolean };
const CATALOG: CatalogItem[] = [
  { id: 'para-raios', name: 'Para-raios — inspeção', rate: 'visit', obrig: true },
  { id: 'hidrante', name: 'Hidrante — teste de pressão', rate: 'visit', obrig: false },
  { id: 'cftv', name: 'CFTV — verificação', rate: 'hour', obrig: false },
  { id: 'bomba-incendio', name: 'Bomba de incêndio — teste', rate: 'visit', obrig: true },
];

export default function OS() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const site = SITE_NAMES[id ?? ''] ?? tr('fieldNav.sites');
  const [services, setServices] = useState<Svc[]>(SERVICES);
  const [pickerOpen, setPickerOpen] = useState(false);

  const addFromCatalog = (c: CatalogItem) => {
    setServices((prev) => [...prev, { id: c.id, name: c.name, who: 'AN', whoName: 'Você', rate: c.rate, done: false, obrig: c.obrig, nest: [] }]);
    setPickerOpen(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <SafeAreaView edges={['top']}>
        <BackBar title={site} onBack={() => router.back()} backLabel={tr('field.back')} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
        {/* site + presence */}
        <View style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="caption" style={{ flex: 1 }}>{tr('field.contract', { name: 'Nadruz' })} · Av. Anísio Haddad, 2000</Text>
            <Row style={{ marginLeft: 8 }}>
              {['AN', 'BR', 'CA'].map((a, i) => (
                <View key={a} style={{ marginLeft: i === 0 ? 0 : -8, borderWidth: 2, borderColor: t.colors.bg, borderRadius: 999 }}>
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

        {/* photos */}
        <View style={{ gap: 7 }}>
          <Text variant="label">{tr('field.photos')}</Text>
          <Row gap={10}>
            <Photo label={`${tr('field.before')} · 8:22`} />
            <Photo label={`${tr('field.after')} · 8:29`} />
          </Row>
        </View>

        {/* services */}
        <View style={{ gap: 9 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="label">{tr('field.visitServices')}</Text>
            <Text variant="caption">{tr('field.selected', { n: services.filter((s) => s.done).length, total: services.length })}</Text>
          </Row>

          {services.map((s) => (
            <View key={s.id} style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: s.done ? t.colors.line : t.colors.accent, borderRadius: 12, paddingBottom: s.nest.length ? 6 : 0 }}>
              <Row gap={10} style={{ paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' }}>
                <Check on={s.done} />
                <View style={{ flex: 1 }}>
                  <Text weight="700" style={{ fontSize: 13.5 }}>{s.name}</Text>
                  <Row gap={5} style={{ alignItems: 'center' }}>
                    <Avatar name={s.who} size={16} />
                    <Text variant="caption">{s.whoName} · {s.obrig ? tr('field.obrig') : tr('field.optional')} · {s.done ? tr('field.statusDone').toLowerCase() : tr('field.statusDoing').toLowerCase()}</Text>
                  </Row>
                </View>
                <Text style={{ fontFamily: undefined, fontSize: 10.5, fontWeight: '700' }} color={t.colors.ink2}>{s.rate === 'hour' ? tr('field.rateHour') : tr('field.rateVisit')}</Text>
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
            </View>
          ))}

          <Pressable accessibilityRole="button" onPress={() => setPickerOpen(true)} style={{ borderWidth: 1.5, borderColor: t.colors.line, borderStyle: 'dashed', borderRadius: 11, paddingVertical: 11, alignItems: 'center' }}>
            <Text weight="700" style={{ fontSize: 13 }} color={t.colors.accent}>{tr('field.addService')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: t.colors.line, backgroundColor: t.colors.surface }}>
        <SlideToConfirm label={tr('field.finishOS')} doneLabel={tr('field.finishedOS')} confirmHint={tr('field.finishHint')} onConfirm={() => router.back()} />
      </SafeAreaView>

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title={tr('field.addServiceTitle')} closeLabel={tr('common.close')} maxHeight="72%">
        <Text variant="caption" style={{ marginBottom: 10 }}>{tr('field.catalogHint')}</Text>
        <View style={{ gap: 8 }}>
          {CATALOG.filter((c) => !services.some((s) => s.id === c.id)).map((c) => (
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
