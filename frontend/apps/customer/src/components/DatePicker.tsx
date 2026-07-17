import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, IconName, Row, Text, useTheme } from '@chamafacil/shared';

const pad = (n: number) => String(n).padStart(2, '0');
const toStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * Field-shaped date input that opens a month-calendar bottom sheet. Pure RN
 * (no native deps), matching the Scheduler's calendar. Value is an ISO date
 * string "YYYY-MM-DD". `disableFuture` greys out days after today.
 */
export function DatePicker({
  label,
  value,
  onChange,
  placeholder,
  disableFuture,
}: {
  label?: string;
  value?: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  disableFuture?: boolean;
}) {
  const t = useTheme();
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const today = new Date();
  const [open, setOpen] = useState(false);

  const parts = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').map(Number) : null;
  const [view, setView] = useState(
    parts ? { y: parts[0], m: parts[1] - 1 } : { y: today.getFullYear(), m: today.getMonth() },
  );

  const openPicker = () => {
    setView(parts ? { y: parts[0], m: parts[1] - 1 } : { y: today.getFullYear(), m: today.getMonth() });
    setOpen(true);
  };

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const isFuture = (d: number) => !!disableFuture && new Date(view.y, view.m, d).getTime() > todayMid;
  const isSel = (d: number) => value === toStr(view.y, view.m, d);

  const dowLabels = Array.from({ length: 7 }, (_, i) => new Date(2024, 8, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }));
  const monthName = new Date(view.y, view.m, 1).toLocaleDateString(locale, { month: 'long' });
  const display = parts
    ? new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  const select = (d: number) => {
    if (isFuture(d)) return;
    onChange(toStr(view.y, view.m, d));
    setOpen(false);
  };

  const navBtn = (icon: IconName, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={15} color={t.colors.ink2} />
    </Pressable>
  );

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <Pressable
        onPress={openPicker}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface2, borderRadius: t.radius.field, borderWidth: 1.5, borderColor: t.colors.line, paddingHorizontal: 14, minHeight: 50 }}
      >
        <Text style={{ fontSize: 15, fontWeight: '500', color: display ? t.colors.ink : t.colors.ink3 }}>{display || placeholder}</Text>
        <Icon name="calendar" size={18} color={t.colors.ink3} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 12 }}
          >
            <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.colors.line }} />
            <Row>
              {navBtn('back', () => setView((v) => ({ y: v.m === 0 ? v.y - 1 : v.y, m: v.m === 0 ? 11 : v.m - 1 })))}
              <Text weight="800" center style={{ flex: 1, fontSize: 15, textTransform: 'capitalize' }}>{monthName}</Text>
              {navBtn('fwd', () => setView((v) => ({ y: v.m === 11 ? v.y + 1 : v.y, m: v.m === 11 ? 0 : v.m + 1 })))}
            </Row>
            <Row>
              {navBtn('back', () => setView((v) => ({ ...v, y: v.y - 1 })))}
              <Text weight="800" center style={{ flex: 1, fontSize: 14 }} color={t.colors.ink2}>{view.y}</Text>
              {navBtn('fwd', () => setView((v) => ({ ...v, y: v.y + 1 })))}
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
                      onPress={() => select(d)}
                      disabled={isFuture(d)}
                      style={{ flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: isSel(d) ? t.colors.accent : 'transparent', opacity: isFuture(d) ? 0.3 : 1 }}
                    >
                      <Text weight="700" style={{ fontSize: 13 }} color={isSel(d) ? '#fff' : t.colors.ink}>{d}</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
