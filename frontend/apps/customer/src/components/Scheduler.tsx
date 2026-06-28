import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Icon, Row, SectionLabel, Text, useTheme } from '@walvee/shared';

export interface Availability {
  starts_at: string;
  ends_at: string;
}

interface DaySel {
  y: number;
  m: number;
  d: number;
  periods: string[];
}

const PERIODS = [
  { key: 'morning', startH: 8, endH: 12 },
  { key: 'afternoon', startH: 12, endH: 18 },
  { key: 'evening', startH: 18, endH: 21 },
];

const keyOf = (s: DaySel) => `${s.y}-${s.m}-${s.d}`;
const iso = (y: number, m: number, d: number, h: number) => new Date(y, m, d, h, 0, 0).toISOString();

/** Month calendar (multi-day) + per-day morning/afternoon/evening windows.
 * Emits backend-shaped availabilities[] via onChange. */
export function Scheduler({ onChange }: { onChange: (a: Availability[]) => void }) {
  const t = useTheme();
  const { t: tr, i18n } = useTranslation();
  const locale = i18n.language;
  const today = new Date();

  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<DaySel[]>([]);

  useEffect(() => {
    const avails: Availability[] = [];
    for (const s of selected) {
      for (const p of s.periods) {
        const def = PERIODS.find((x) => x.key === p)!;
        avails.push({ starts_at: iso(s.y, s.m, s.d, def.startH), ends_at: iso(s.y, s.m, s.d, def.endH) });
      }
    }
    onChange(avails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isPast = (d: number) =>
    view.y < today.getFullYear() ||
    (view.y === today.getFullYear() && (view.m < today.getMonth() || (view.m === today.getMonth() && d < today.getDate())));
  const isToday = (d: number) => view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate();
  const selKey = (d: number) => `${view.y}-${view.m}-${d}`;
  const isSel = (d: number) => selected.some((s) => keyOf(s) === selKey(d));

  const toggleDay = (d: number) => {
    if (isPast(d)) return;
    setSelected((cur) => {
      const k = selKey(d);
      if (cur.some((s) => keyOf(s) === k)) return cur.filter((s) => keyOf(s) !== k);
      return [...cur, { y: view.y, m: view.m, d, periods: ['morning'] }].sort((a, b) => new Date(a.y, a.m, a.d).getTime() - new Date(b.y, b.m, b.d).getTime());
    });
  };
  const togglePeriod = (s: DaySel, p: string) =>
    setSelected((cur) => cur.map((x) => (keyOf(x) === keyOf(s) ? { ...x, periods: x.periods.includes(p) ? x.periods.filter((y) => y !== p) : [...x.periods, p] } : x)));

  const canPrev = view.y > today.getFullYear() || view.m > today.getMonth();
  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  // 2024-09-01 is a Sunday → narrow weekday labels Sun..Sat.
  const dowLabels = Array.from({ length: 7 }, (_, i) => new Date(2024, 8, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }));

  return (
    <>
      <SectionLabel>{tr('scheduler.pickDays')}</SectionLabel>
      <Card flat style={{ gap: 8 }}>
        <Row>
          <Text weight="800" style={{ flex: 1, fontSize: 15, textTransform: 'capitalize' }}>{monthLabel}</Text>
          <Pressable disabled={!canPrev} onPress={() => setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: v.m === 0 ? 11 : v.m - 1 }))} style={{ width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center', opacity: canPrev ? 1 : 0.4 }}>
            <Icon name="back" size={16} color={t.colors.ink2} />
          </Pressable>
          <Pressable onPress={() => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: v.m === 11 ? 0 : v.m + 1 }))} style={{ width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center', marginLeft: 6 }}>
            <Icon name="fwd" size={16} color={t.colors.ink2} />
          </Pressable>
        </Row>
        <Row>
          {dowLabels.map((l, i) => (
            <Text key={i} center style={{ flex: 1, fontSize: 10, fontWeight: '800', color: t.colors.ink3, textTransform: 'uppercase' }}>{l}</Text>
          ))}
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) => (
            <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
              {d != null && (
                <Pressable
                  onPress={() => toggleDay(d)}
                  style={{ flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: isSel(d) ? t.colors.accent : 'transparent', opacity: isPast(d) ? 0.35 : 1, borderWidth: isToday(d) && !isSel(d) ? 2 : 0, borderColor: t.colors.accent }}
                >
                  <Text weight="700" style={{ fontSize: 13 }} color={isSel(d) ? '#fff' : isToday(d) ? t.colors.accent : t.colors.ink}>{d}</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </Card>

      {selected.length > 0 && (
        <>
          <SectionLabel>{tr('scheduler.hoursPerDay')}</SectionLabel>
          {selected.map((s) => {
            const date = new Date(s.y, s.m, s.d);
            return (
              <Card key={keyOf(s)} flat style={{ gap: 8 }}>
                <Row>
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Text weight="800" color={t.colors.accent}>{s.d}</Text>
                  </View>
                  <Text weight="800" style={{ flex: 1, fontSize: 13.5, textTransform: 'capitalize' }}>{date.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })}</Text>
                  <Pressable onPress={() => toggleDay(s.d)} hitSlop={8}><Icon name="close" size={16} color={t.colors.ink3} /></Pressable>
                </Row>
                <Row gap={6}>
                  {PERIODS.map((p) => {
                    const on = s.periods.includes(p.key);
                    return (
                      <Pressable key={p.key} onPress={() => togglePeriod(s, p.key)} style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: on ? t.colors.accent : t.colors.line, backgroundColor: on ? t.colors.accent : t.colors.surface }}>
                        <Text weight="700" style={{ fontSize: 11.5 }} color={on ? '#fff' : t.colors.ink2}>{tr(`scheduler.${p.key}`)}</Text>
                        <Text style={{ fontSize: 9.5, fontWeight: '700', marginTop: 2 }} color={on ? 'rgba(255,255,255,0.8)' : t.colors.ink3}>{`${p.startH}–${p.endH}`}</Text>
                      </Pressable>
                    );
                  })}
                </Row>
              </Card>
            );
          })}
        </>
      )}
    </>
  );
}
