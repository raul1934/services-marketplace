import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Field, Icon, Row, Text, focusRing, useTheme, withFocusRing } from '@chamafacil/shared';

export interface LinkedItem {
  id: number;
  name: string;
  /** Logo URL (e.g. a brand logo), if any. */
  logoUrl?: string | null;
  children: { id: number; name: string }[];
}

type Picking = 'parent' | 'child' | null;

/**
 * Generic two-level id picker: pick a parent, then a child scoped to it (no free
 * text). Used for vehicle make→model (with brand logos) and pet species→breed.
 */
export function LinkedPicker({
  items,
  parentId,
  childId,
  onChange,
  labels,
}: {
  items: LinkedItem[];
  parentId: number | null;
  childId: number | null;
  onChange: (v: { parentId: number | null; childId: number | null }) => void;
  labels: {
    parent: string;
    child: string;
    selectParent: string;
    selectChild: string;
    childNeedsParent: string;
    searchParent: string;
    searchChild: string;
  };
}) {
  const t = useTheme();

  // Modals render outside the screen's SafeAreaView, so the sheet has to

  // clear Android's navigation bar itself.

  const insets = useSafeAreaInsets();
  const [picking, setPicking] = useState<Picking>(null);
  const [search, setSearch] = useState('');

  const parent = useMemo(() => items.find((i) => i.id === parentId), [items, parentId]);
  const children = parent?.children ?? [];
  const parentName = parent?.name ?? '';
  const childName = children.find((c) => c.id === childId)?.name ?? '';

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = picking === 'parent' ? items : picking === 'child' ? children : [];
    return q ? list.filter((r) => r.name.toLowerCase().includes(q)) : list;
  }, [picking, search, items, children]);

  const open = (which: Picking) => { setSearch(''); setPicking(which); };
  const select = (id: number) => {
    if (picking === 'parent') onChange({ parentId: id, childId: null });
    else if (picking === 'child') onChange({ parentId, childId: id });
    setPicking(null);
  };

  return (
    <>
      <PickerField
        label={labels.parent}
        value={parentName}
        placeholder={labels.selectParent}
        left={parent?.logoUrl ? <Image source={{ uri: parent.logoUrl }} style={{ width: 30, height: 30 }} resizeMode="contain" /> : null}
        onPress={() => open('parent')}
      />
      <PickerField
        label={labels.child}
        value={childName}
        placeholder={parentId ? labels.selectChild : labels.childNeedsParent}
        disabled={!parentId}
        onPress={() => parentId && open('child')}
      />

      <Modal visible={picking !== null} transparent animationType="fade" onRequestClose={() => setPicking(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setPicking(null)}>
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 + insets.bottom, gap: 14, maxHeight: '80%' }}
          >
            <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.colors.line }} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="h3">{picking === 'parent' ? labels.selectParent : labels.selectChild}</Text>
              <Pressable onPress={() => setPicking(null)} accessibilityRole="button" hitSlop={8} style={({ focused }: any) => focusRing(t.colors.accent, focused)}>
                <Icon name="close" size={22} color={t.colors.ink3} />
              </Pressable>
            </Row>
            <Field value={search} onChangeText={setSearch} placeholder={picking === 'parent' ? labels.searchParent : labels.searchChild} autoCapitalize="none" autoCorrect={false} />
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
              {rows.map((r) => {
                const active = picking === 'parent' ? r.id === parentId : r.id === childId;
                const logoUrl = (r as LinkedItem).logoUrl;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => select(r.id)}
                    style={withFocusRing(t.colors.accent, { paddingVertical: 12, borderBottomWidth: 1, borderColor: t.colors.line, flexDirection: 'row', alignItems: 'center', gap: 12 })}
                  >
                    {picking === 'parent' ? (
                      <View style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                        {logoUrl ? <Image source={{ uri: logoUrl }} style={{ width: 38, height: 38 }} resizeMode="contain" /> : null}
                      </View>
                    ) : null}
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: active ? '800' : '500', color: active ? t.colors.accent : t.colors.ink }}>{r.name}</Text>
                    {active ? <Icon name="check" size={18} color={t.colors.accent} /> : null}
                  </Pressable>
                );
              })}
              {rows.length === 0 ? <Text variant="caption" style={{ paddingVertical: 16 }} center>—</Text> : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function PickerField({ label, value, placeholder, disabled, left, onPress }: { label: string; value?: string; placeholder?: string; disabled?: boolean; left?: React.ReactNode; onPress?: () => void }) {
  const t = useTheme();
  const isPh = !value;
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">{label}</Text>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={withFocusRing(t.colors.accent, { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.colors.surface2, borderRadius: t.radius.field, borderWidth: 1.5, borderColor: t.colors.line, paddingHorizontal: 14, minHeight: 50, opacity: disabled ? 0.55 : 1 })}
      >
        {left}
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: isPh ? t.colors.ink3 : t.colors.ink }}>{value || placeholder}</Text>
        <Icon name="arrowR" size={18} color={t.colors.ink3} />
      </Pressable>
    </View>
  );
}
