import React, { useRef, useState } from 'react';
import { LayoutRectangle, PanResponder, Pressable, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme';
import { Text } from './Text';
import { Icon, IconName } from './Icon';
import { SuggPill } from './primitives';

const RED = '#ef4444';
const YEL = '#f5a524';
const GRN = '#18b368';

export type BudgetZone = 'low' | 'fair' | 'high';

/**
 * Traffic-light speedometer budget/bid meter (chamafacil BudgetMeter). Red/amber/
 * green zones around the regional average, a draggable needle, a currency field
 * with ± steppers, and a plain-language likelihood line. `mode` flips which end
 * is green: 'budget' (higher = greener) vs 'bid' (lower = greener).
 */
export function BudgetMeter({
  value,
  onChange,
  min = 60,
  max = 300,
  step = 5,
  bandLo = 90,
  bandHi = 160,
  regionAvg,
  mode = 'budget',
  label,
  currency = 'R$',
  pill,
  pillIcon = 'sparkles',
  renderInfo,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  bandLo?: number;
  bandHi?: number;
  regionAvg?: number;
  mode?: 'budget' | 'bid';
  label: string;
  currency?: string;
  pill?: string;
  pillIcon?: IconName;
  renderInfo?: (ctx: { word: BudgetZone; value: number; avg: number; color: string }) => React.ReactNode;
}) {
  const t = useTheme();
  const avg = regionAvg != null ? regionAvg : Math.round((bandLo + bandHi) / 2);
  const cx = 110, cy = 98, r = 80, sw = 15;
  const cl = (v: number) => Math.max(min, Math.min(max, v));
  const [focus, setFocus] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const layout = useRef<LayoutRectangle | null>(null);

  const ang = (v: number) => 180 - 180 * ((cl(v) - min) / (max - min));
  const polar = (a: number, rr = r): [number, number] => [
    cx + rr * Math.cos((a * Math.PI) / 180),
    cy - rr * Math.sin((a * Math.PI) / 180),
  ];
  const arc = (a0: number, a1: number, rr = r) => {
    const [x0, y0] = polar(a0, rr);
    const [x1, y1] = polar(a1, rr);
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    const sweep = a0 > a1 ? 1 : 0;
    return `M ${x0} ${y0} A ${rr} ${rr} 0 ${large} ${sweep} ${x1} ${y1}`;
  };

  const setFromPointer = (locX: number, locY: number) => {
    const lay = layout.current;
    if (!lay) return;
    const px = (locX / lay.width) * 220;
    const py = (locY / lay.height) * 112;
    let a = (Math.atan2(cy - py, px - cx) * 180) / Math.PI;
    a = Math.max(0, Math.min(180, a));
    const v = min + ((180 - a) / 180) * (max - min);
    onChange(cl(Math.round(v / step) * step));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromPointer(e.nativeEvent.locationX, e.nativeEvent.locationY),
      onPanResponderMove: (e) => setFromPointer(e.nativeEvent.locationX, e.nativeEvent.locationY),
    }),
  ).current;

  const shown = cl(value);
  const lowC = mode === 'bid' ? GRN : RED;
  const highC = mode === 'bid' ? RED : GRN;
  const zones: [number, number, string][] = [
    [min, bandLo, lowC],
    [bandLo, bandHi, YEL],
    [bandHi, max, highC],
  ];
  const zc = shown < bandLo ? lowC : shown <= bandHi ? YEL : highC;
  const word: BudgetZone = zc === GRN ? 'high' : zc === YEL ? 'fair' : 'low';
  const zoneBg = zc === GRN ? 'rgba(24,179,104,.12)' : zc === YEL ? 'rgba(245,165,36,.15)' : 'rgba(239,68,68,.12)';

  const [nx, ny] = polar(ang(shown), r - 12);
  const [ax, ay] = polar(ang(avg), r + sw / 2 + 1);
  const [ax2, ay2] = polar(ang(avg), r - sw / 2 - 1);
  const [alx, aly] = polar(ang(avg), r + 15);

  const stepBy = (d: number) => {
    setText(null);
    onChange(cl(shown + d));
  };
  const onText = (raw: string) => setText(raw.replace(/[^\d]/g, ''));
  const commit = () => {
    setFocus(false);
    if (text != null && text !== '') onChange(cl(parseInt(text, 10)));
    setText(null);
  };

  return (
    <View style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.card, padding: 16, paddingBottom: 14, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: t.colors.ink3 }}>{label}</Text>
        {pill ? <SuggPill label={pill} icon={pillIcon} /> : null}
      </View>

      <View
        style={{ marginTop: 6, aspectRatio: 220 / 112 }}
        onLayout={(e) => (layout.current = e.nativeEvent.layout)}
        {...pan.panHandlers}
      >
        <Svg width="100%" height="100%" viewBox="0 0 220 112">
          {zones.map(([z0, z1, c], i) => (
            <Path key={i} d={arc(ang(z0) - 1.2, ang(z1) + 1.2)} fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" />
          ))}
          <Line x1={ax} y1={ay} x2={ax2} y2={ay2} stroke={t.colors.ink} strokeWidth={2.5} strokeLinecap="round" />
          <SvgText x={alx} y={aly} fontSize={9.5} fontWeight="700" fill={t.colors.ink3} textAnchor="middle">
            avg
          </SvgText>
          <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke={t.colors.ink} strokeWidth={4} strokeLinecap="round" />
          <Circle cx={nx} cy={ny} r={6} fill={zc} stroke={t.colors.surface} strokeWidth={2.5} />
          <Circle cx={cx} cy={cy} r={7.5} fill={t.colors.ink} />
          <Circle cx={cx} cy={cy} r={3.2} fill={t.colors.surface} />
        </Svg>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 2 }}>
        <Stepper icon="minus" onPress={() => stepBy(-step)} />
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, backgroundColor: t.colors.surface2, borderWidth: 1.5, borderColor: focus ? t.colors.accent : t.colors.line, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: t.colors.ink2 }}>{currency}</Text>
          <TextInput
            value={text != null ? text : String(shown)}
            onChangeText={onText}
            onFocus={() => setFocus(true)}
            onBlur={commit}
            keyboardType="number-pad"
            style={{ width: 78, textAlign: 'center', fontWeight: '800', fontSize: 30, color: zc, padding: 0 }}
          />
        </View>
        <Stepper icon="plus" onPress={() => stepBy(step)} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.colors.ink3 }}>{currency} {min}</Text>
        <Text style={{ fontSize: 11.5, fontWeight: '700', color: t.colors.ink3 }}>{currency} {max}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: zoneBg }}>
        <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: zc, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={word === 'low' ? 'flash' : word === 'fair' ? 'clock' : 'check'} size={15} color="#fff" strokeWidth={2.6} />
        </View>
        <View style={{ flex: 1 }}>
          {renderInfo ? (
            renderInfo({ word, value: shown, avg, color: zc })
          ) : (
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: t.colors.ink2 }}>
              {currency} {avg} avg · {currency} {shown} ({word})
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function Stepper({ icon, onPress }: { icon: IconName; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width: 40, height: 40, borderRadius: 13, borderWidth: 1, borderColor: t.colors.line, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={20} color={t.colors.ink} strokeWidth={2.6} />
    </Pressable>
  );
}
