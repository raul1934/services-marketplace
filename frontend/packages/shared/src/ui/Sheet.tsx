import React from 'react';
import { Modal, Pressable, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { focusRing } from '../lib/a11y';
import { Icon } from './Icon';
import { Row } from './primitives';
import { Text } from './Text';

/**
 * Bottom sheet: scrim, panel, grab handle, optional title row with a close
 * button, and the Android navigation-bar inset a Modal doesn't inherit.
 *
 * This existed six times before — `DictationModal`, `RequestFilterSheet`,
 * `RecordKmSheet`, `SinglePicker`, `LinkedPicker`, `DatePicker` — copied closely
 * enough that the same explanatory comment appeared verbatim in all of them. The
 * copies had already drifted on padding, on whether the close button had a label,
 * and on the inset fix, which is why "pad the sheets past the nav bar" had to be
 * fixed once per file.
 *
 * Two things it does that none of the copies did:
 *
 * - The scrim and the panel are `accessible={false}`. Both are `Pressable` (the
 *   scrim to dismiss, the panel to swallow that press), so a screen reader used
 *   to hit two unlabelled stops before reaching anything real inside the sheet.
 * - The panel is marked as a modal region, so the screen behind it stops being
 *   reachable while the sheet is open instead of being read straight through.
 */
export function Sheet({
  visible,
  onClose,
  title,
  closeLabel,
  children,
  maxHeight,
  contentStyle,
}: {
  visible: boolean;
  onClose: () => void;
  /** Omit for a sheet with no header row (the dictation sheet draws its own). */
  title?: string;
  /** Accessible name for the close button. Required whenever `title` is set. */
  closeLabel?: string;
  children: React.ReactNode;
  /** e.g. '80%' for long, scrollable lists. */
  maxHeight?: ViewStyle['maxHeight'];
  contentStyle?: ViewStyle;
}) {
  const t = useTheme();
  // Modals render outside the screen's SafeAreaView, so the sheet has to clear
  // Android's navigation bar itself.
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessible={false}
        // `accessible={false}` alone is not enough on Android: a clickable
        // Pressable still lands in the tree as a stop. Verified on device — the
        // scrim showed up as an unlabelled full-screen ViewGroup until this.
        importantForAccessibility="no"
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          accessibilityViewIsModal
          onPress={(e) => e.stopPropagation?.()}
          style={[
            {
              backgroundColor: t.colors.bg,
              borderTopLeftRadius: t.radius.sheet,
              borderTopRightRadius: t.radius.sheet,
              paddingHorizontal: t.space.xl,
              paddingTop: 14,
              paddingBottom: 28 + insets.bottom,
              gap: t.space.lg,
              maxHeight,
            },
            contentStyle,
          ]}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.colors.line }}
          />
          {title ? (
            <Row style={{ justifyContent: 'space-between' }}>
              <Text variant="h3">{title}</Text>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={closeLabel}
                // The glyph is 22px; hitSlop is what gets the target to 44dp.
                hitSlop={12}
                style={({ focused }: any) => focusRing(t.colors.accent, focused)}
              >
                <Icon name="close" size={22} color={t.colors.ink3} />
              </Pressable>
            </Row>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
