import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { focusRing } from '../lib/a11y';
import { Avatar } from './Avatar';
import { BrandMark } from './auth/BrandMark';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

export interface DrawerItem {
  icon: IconName;
  label: string;
  badge?: number;
  danger?: boolean;
  /** Marks the row as the current screen (accent bar + tint + bold). */
  active?: boolean;
  /** Section color used when `active`; falls back to the theme accent. */
  accent?: string;
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
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* The panel is a raw Modal child, so no SafeAreaView pads it: the
            bottom inset has to be added by hand or the footer ("Sair") renders
            under Android's nav buttons. */}
        <View style={{ width: '84%', maxWidth: 360, backgroundColor: t.colors.bg, paddingTop: insets.top + 14, paddingBottom: 20 + insets.bottom, ...t.shadow }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 }}>
            <Avatar name={name} uri={avatarUri ?? undefined} size={52} />
            <View style={{ flex: 1 }}>
              <Text weight="800" style={{ fontSize: 17 }} numberOfLines={1}>{name ?? '—'}</Text>
              {subtitle ? <Text variant="caption" numberOfLines={1}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={({ focused }: any) => focusRing(t.colors.accent, focused)}>
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

          {/* Brand signature: the only place the logged-in app carries the mark.
              Muted and out of the way — the header is the user's identity, this
              is the app's. Shared, so both apps get it. */}
          <View style={{ alignItems: 'center', paddingTop: 14, opacity: 0.5 }}>
            <BrandMark height={18} color={t.colors.ink3} />
          </View>
        </View>

        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      </View>
    </Modal>
  );
}

function DrawerRow({ item, onClose }: { item: DrawerItem; onClose: () => void }) {
  const t = useTheme();
  const active = !!item.active;
  const tint = item.accent ?? t.colors.accent;
  const color = item.danger ? t.colors.danger : active ? tint : t.colors.ink;
  return (
    <Pressable
      onPress={() => { onClose(); item.onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      style={({ pressed, focused }: any) => [
        // A 3px bar is always reserved (transparent when inactive) so the active
        // state never shifts the row's content sideways.
        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 17, paddingRight: 20, paddingVertical: 13, borderLeftWidth: 3, borderLeftColor: active ? tint : 'transparent', backgroundColor: active ? tint + '14' : undefined },
        pressed && { backgroundColor: t.colors.surface2 },
        focusRing(t.colors.accent, focused),
      ]}
    >
      <Icon name={item.icon} size={20} color={item.danger ? t.colors.danger : active ? tint : t.colors.ink2} />
      <Text weight={active ? '800' : '700'} style={{ flex: 1, fontSize: 15 }} color={color} numberOfLines={1}>{item.label}</Text>
      {/* Badge só quando houver; o chevron por-linha era ruído (todo clique navega). */}
      {item.badge ? (
        <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text weight="800" color="#fff" style={{ fontSize: 11 }}>{item.badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
