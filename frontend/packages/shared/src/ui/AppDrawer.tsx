import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../theme';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { Text } from './Text';

export interface DrawerItem {
  icon: string;
  label: string;
  badge?: number;
  danger?: boolean;
  onPress: () => void;
}
export interface DrawerSection {
  title?: string;
  items: DrawerItem[];
}

/**
 * Shared hamburger drawer (AppDrawer). A runtime overlay (not a navigator) so it
 * works over the existing tab stacks. Header with avatar/name/subtitle, grouped
 * items with optional badges, and a footer action ("Sair"). Each app supplies
 * its own role-specific sections wired to router navigation.
 */
export function AppDrawer({
  visible,
  onClose,
  name,
  subtitle,
  avatarUri,
  sections,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  name?: string | null;
  subtitle?: string | null;
  avatarUri?: string | null;
  sections: DrawerSection[];
  footer?: DrawerItem;
}) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ width: '84%', maxWidth: 360, backgroundColor: t.colors.bg, paddingTop: 52, paddingBottom: 20, ...t.shadow }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 }}>
            <Avatar name={name} uri={avatarUri ?? undefined} size={52} />
            <View style={{ flex: 1 }}>
              <Text weight="800" style={{ fontSize: 17 }} numberOfLines={1}>{name ?? '—'}</Text>
              {subtitle ? <Text variant="caption" numberOfLines={1}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Icon name="close" size={22} color={t.colors.ink2} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {sections.map((s, i) => (
              <View key={i} style={{ marginTop: 10 }}>
                {s.title ? (
                  <Text style={{ paddingHorizontal: 20, fontSize: 11.5, fontWeight: '800', letterSpacing: 1, color: t.colors.ink3, marginBottom: 2 }}>
                    {s.title.toUpperCase()}
                  </Text>
                ) : null}
                {s.items.map((it, j) => (
                  <DrawerRow key={j} item={it} onClose={onClose} />
                ))}
              </View>
            ))}
          </ScrollView>

          {footer ? (
            <View style={{ borderTopWidth: 1, borderColor: t.colors.line, paddingTop: 6 }}>
              <DrawerRow item={footer} onClose={onClose} />
            </View>
          ) : null}
        </View>

        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      </View>
    </Modal>
  );
}

function DrawerRow({ item, onClose }: { item: DrawerItem; onClose: () => void }) {
  const t = useTheme();
  const color = item.danger ? t.colors.danger : t.colors.ink;
  return (
    <Pressable
      onPress={() => { onClose(); item.onPress(); }}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 13 }, pressed && { backgroundColor: t.colors.surface2 }]}
    >
      <Icon name={item.icon} size={20} color={item.danger ? t.colors.danger : t.colors.ink2} />
      <Text weight="700" style={{ flex: 1, fontSize: 15 }} color={color}>{item.label}</Text>
      {item.badge ? (
        <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text weight="800" color="#fff" style={{ fontSize: 11 }}>{item.badge}</Text>
        </View>
      ) : (
        !item.danger && <Icon name="arrowR" size={16} color={t.colors.ink3} />
      )}
    </Pressable>
  );
}
