import React, { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, Avatar, Card, Icon, Row, Text, useTheme, Wiz } from '@chamafacil/shared';
import { fieldApi } from '../../src/field/api';

/**
 * Start the shift — the shared Wiz stepper. Step 1 picks the crew, step 2 the
 * chargeable equipment being taken (that set scopes what can be charged on the
 * day's service orders). On confirm, land on today's routes. Crew/equipment mock.
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

export default function Shift() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const now = useClock();
  const [step, setStep] = useState(1);
  const [crew, setCrew] = useState<Set<string>>(() => new Set(['an', 'br']));
  const [gear, setGear] = useState<Set<string>>(() => new Set(['multimetro', 'alicate', 'bomba']));
  const [starting, setStarting] = useState(false);
  const [slideReset, setSlideReset] = useState(0);

  // Open the shift for real: master shift for the leader, then one crew add per
  // selected member. On failure, surface it and snap the slider back to retry.
  // (Equipment/GEAR has no shift-level backend field yet — kept as a local choice.)
  const startShift = async () => {
    if (starting) return;
    setStarting(true);
    try {
      await fieldApi.startShift();
      const members = CREW.filter((m) => crew.has(m.id) && !m.you);
      for (const m of members) await fieldApi.addCrew(m.name);
      router.replace('/(field)/routes');
    } catch (e) {
      Alert.alert(tr('field.shiftStartError'), e instanceof ApiError ? e.message : String((e as Error)?.message ?? e));
      setSlideReset((n) => n + 1);
      setStarting(false);
    }
  };

  const toggle = (current: Set<string>, apply: (s: Set<string>) => void, id: string) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  };

  const onCrew = step === 1;
  const count = onCrew ? crew.size : gear.size;
  const total = onCrew ? CREW.length : GEAR.length;
  const dateLabel = `${WD[now.getDay()]}, ${now.getDate()} ${MO[now.getMonth()]}`;

  return (
    <Wiz
      cat={tr('field.startTitle')}
      step={step}
      total={2}
      title={onCrew ? tr('field.crewLabel') : tr('field.gearLabel')}
      sub={onCrew ? tr('field.crewSub') : tr('field.gearSub')}
      stepLabel={`${tr('field.stepShort')} ${step}/2`}
      backLabel={tr('field.back')}
      onBack={() => (step > 1 ? setStep(step - 1) : router.back())}
      footer={
        onCrew
          ? { primary: { label: tr('field.next'), onPress: () => setStep(2), disabled: crew.size === 0 } }
          : { slide: { label: tr('field.slide'), doneLabel: tr('field.slideDone'), confirmHint: tr('field.slideHint'), onConfirm: startShift, resetSignal: slideReset } }
      }
    >
      <Card style={{ alignItems: 'center', gap: 5, paddingVertical: 14 }}>
        <Text variant="caption">{dateLabel} · Base Prumo</Text>
        <Text weight="800" style={{ fontSize: 30, letterSpacing: -0.5, fontVariant: ['tabular-nums'] }}>
          {pad(now.getHours())}:{pad(now.getMinutes())}
        </Text>
        <Row gap={7} style={{ marginTop: 1, alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent }} />
          <Text weight="700" style={{ fontSize: 12 }} color={t.colors.accent}>{tr('field.geoOk')} · {tr('field.notStarted')}</Text>
        </Row>
      </Card>

      <Text variant="caption">{tr('field.selected', { n: count, total })}</Text>

      <Card padded={false} style={{ paddingVertical: 4 }}>
        {onCrew
          ? CREW.map((m) => {
              const on = crew.has(m.id);
              return (
                <Pressable key={m.id} onPress={() => toggle(crew, setCrew, m.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={m.name} style={{ paddingHorizontal: 13, paddingVertical: 9 }}>
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
            })
          : GEAR.map((g) => {
              const on = gear.has(g.id);
              return (
                <Pressable key={g.id} onPress={() => toggle(gear, setGear, g.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={g.name} style={{ paddingHorizontal: 13, paddingVertical: 9 }}>
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
    </Wiz>
  );
}

function Check({ on }: { on: boolean }) {
  const t = useTheme();
  return (
    <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: on ? 0 : 1.5, borderColor: t.colors.line, backgroundColor: on ? t.colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      {on ? <Icon name="check" size={15} color="#fff" /> : null}
    </View>
  );
}
