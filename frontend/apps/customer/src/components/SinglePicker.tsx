import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Field, Icon, Row, Text, useTheme } from '@walvee/shared';
import { PickerField } from './LinkedPicker';

/** Generic single-level id picker (search + select). Used for property type. */
export function SinglePicker({
  label,
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
}: {
  label: string;
  items: { id: number; name: string }[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder: string;
  searchPlaceholder: string;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedName = items.find((i) => i.id === value)?.name ?? '';
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [search, items]);

  return (
    <>
      <PickerField label={label} value={selectedName} placeholder={placeholder} onPress={() => { setSearch(''); setOpen(true); }} />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 14, maxHeight: '80%' }}
          >
            <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.colors.line }} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="h3">{placeholder}</Text>
              <Pressable onPress={() => setOpen(false)} accessibilityRole="button" hitSlop={8}>
                <Icon name="close" size={22} color={t.colors.ink3} />
              </Pressable>
            </Row>
            <Field value={search} onChangeText={setSearch} placeholder={searchPlaceholder} autoCapitalize="none" autoCorrect={false} />
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
              {rows.map((r) => {
                const active = r.id === value;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => { onChange(r.id); setOpen(false); }}
                    style={{ paddingVertical: 13, borderBottomWidth: 1, borderColor: t.colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: active ? '800' : '500', color: active ? t.colors.accent : t.colors.ink }}>{r.name}</Text>
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
