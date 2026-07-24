import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar, Card, Icon, Row, Screen, SectionLabel, SlideToConfirm, Text, useTheme } from '@chamafacil/shared';

/**
 * Field-service home — start of the shift. The operator *assembles* the shift:
 * picks the crew and the chargeable equipment they're taking (the equipment set
 * scopes what can be charged on the day's service orders), then starts the shift.
 * Crew and equipment are mock here — a real backend supplies them. First screen
 * of the field flow (field_service flag). See the field prototype and
 * docs/b2b-arquitetura-referencia-yeti.md.
 */

type Charge = 'visit' | 'hour';

const CREW: { id: string; name: string; role: string; you?: boolean }[] = [
  { id: 'an', name: 'Anderson Lima', role: 'Elétrica e hidráulica', you: true },
  { id: 'br', name: 'Bruno Alves', role: 'Refrigeração' },
  { id: 'ca', name: 'Carla Dias', role: 'Auxiliar' },
  { id: 'di', name: 'Diego Rocha', role: 'Elétrica' },
];

const GEAR: { id: string; name: string; charge: Charge }[] = [
  { id: 'multimetro', name: 'Multímetro', charge: 'hour' },
  { id: 'alicate', name: 'Alicate-amperímetro', charge: 'hour' },
  { id: 'bomba', name: 'Bomba de vácuo', charge: 'visit' },
  { id: 'furadeira', name: 'Furadeira SDS', charge: 'visit' },
];

const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const pad = (n: number) => String(n).padStart(2, '0');

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Field() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const now = useClock();
  const [crew, setCrew] = useState<Set<string>>(() => new Set(['an', 'br']));
  const [gear, setGear] = useState<Set<string>>(() => new Set(['multimetro', 'alicate', 'bomba']));
  const [started, setStarted] = useState(false);

  const toggle = (current: Set<string>, apply: (s: Set<string>) => void, id: string) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  };

  return (
    <Screen
      footer={
        <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
          <SlideToConfirm
            label={started ? tr('field.slideDone') : tr('field.slide')}
            doneLabel={tr('field.slideDone')}
            confirmHint={tr('field.slideHint')}
            variant={started ? 'success' : 'accept'}
            disabled={crew.size === 0}
            onConfirm={() => setStarted(true)}
          />
        </View>
      }
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 16 }}>
        {/* greeting */}
        <Row gap={12}>
          <Avatar name="Anderson Lima" size={44} />
          <View style={{ flex: 1 }}>
            <Text weight="800" style={{ fontSize: 20, letterSpacing: -0.3 }}>{tr('field.greeting')}, Anderson</Text>
            <Text variant="caption">Prumo Manutenção Predial</Text>
          </View>
        </Row>

        {/* clock-in */}
        <Card style={{ alignItems: 'center', gap: 5, paddingVertical: 18 }}>
          <Text variant="caption">{WD[now.getDay()]}, {now.getDate()} {MO[now.getMonth()]} · Base Prumo</Text>
          <Text weight="800" style={{ fontSize: 34, letterSpacing: -0.5, fontVariant: ['tabular-nums'] }}>
            {pad(now.getHours())}:{pad(now.getMinutes())}
          </Text>
          <Row gap={7} style={{ marginTop: 3, alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: started ? t.colors.ok : t.colors.accent }} />
            <Text weight="700" style={{ fontSize: 12 }} color={started ? t.colors.ok : t.colors.accent}>
              {started ? tr('field.slideDone') : `${tr('field.geoOk')} · ${tr('field.notStarted')}`}
            </Text>
          </Row>
        </Card>

        {/* crew selection */}
        <View style={{ gap: 8 }}>
          <SectionLabel count={`${crew.size}/${CREW.length}`}>{tr('field.crewLabel')}</SectionLabel>
          <Card padded={false} style={{ paddingVertical: 4 }}>
            {CREW.map((m) => {
              const on = crew.has(m.id);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggle(crew, setCrew, m.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={m.name}
                  style={{ paddingHorizontal: 13, paddingVertical: 9 }}
                >
                  <Row gap={11}>
                    <Avatar name={m.name} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text weight="700" style={{ fontSize: 14 }}>{m.name}</Text>
                      <Text variant="caption">{m.you ? tr('field.you') : m.role}</Text>
                    </View>
                    <Check on={on} />
                  </Row>
                </Pressable>
              );
            })}
          </Card>
        </View>

        {/* chargeable equipment to carry */}
        <View style={{ gap: 8 }}>
          <SectionLabel count={`${gear.size}/${GEAR.length}`}>{tr('field.gearLabel')}</SectionLabel>
          <Card padded={false} style={{ paddingVertical: 4 }}>
            {GEAR.map((g) => {
              const on = gear.has(g.id);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => toggle(gear, setGear, g.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={g.name}
                  style={{ paddingHorizontal: 13, paddingVertical: 9 }}
                >
                  <Row gap={11}>
                    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: t.colors.surface2, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="wrench" size={17} color={t.colors.ink3} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text weight="700" style={{ fontSize: 14 }}>{g.name}</Text>
                      <Text variant="caption">{g.charge === 'hour' ? tr('field.chargeHour') : tr('field.chargeVisit')}</Text>
                    </View>
                    <Check on={on} />
                  </Row>
                </Pressable>
              );
            })}
          </Card>
        </View>

        {started ? (
          <Row gap={9} style={{ backgroundColor: t.colors.accentSoft, borderRadius: 12, padding: 12 }}>
            <Icon name="check" size={18} color={t.colors.accent} />
            <Text style={{ flex: 1, fontSize: 12.5, fontWeight: '600' }} color={t.colors.accent}>{tr('field.startedNext')}</Text>
          </Row>
        ) : null}
      </View>
    </Screen>
  );
}

function Check({ on }: { on: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: on ? 0 : 1.5,
        borderColor: t.colors.line,
        backgroundColor: on ? t.colors.accent : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {on ? <Icon name="check" size={15} color="#fff" /> : null}
    </View>
  );
}
