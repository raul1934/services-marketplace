import React from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StatusBar, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Text } from './Text';

/** Screen container: themed background + safe area + optional scroll. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  // Both edges by default: the bottom one keeps content clear of Android's nav
  // buttons and the iOS home indicator. Inside a tab navigator this costs
  // nothing — SafeAreaView only pads where the view actually meets the screen
  // edge, and there the tab bar already does.
  edges = ['top', 'bottom'],
  footer,
  stickyHeader = false,
  onEndReached,
  onEndReachedThreshold = 0.4,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Pinned to the bottom of the screen, outside the scroll (e.g. a slide-to-confirm). */
  footer?: React.ReactNode;
  /**
   * Pin the first child (the screen's header — AppBar / BackBar / title) above
   * the scroll so it stays put while the body scrolls. No-op for single-child
   * screens (e.g. a loading spinner), which render normally.
   */
  stickyHeader?: boolean;
  /**
   * Fires once when the scroll nears the bottom — lets a composite screen
   * paginate an inline list without nesting a virtualized list in the scroll
   * view. Re-arms after the user scrolls back above the threshold.
   */
  onEndReached?: () => void;
  /** Fraction of a viewport from the bottom at which `onEndReached` fires. */
  onEndReachedThreshold?: number;
}) {
  const t = useTheme();
  // Guard so onEndReached fires once per approach, not on every scroll frame.
  const armed = React.useRef(true);
  const handleScroll = onEndReached
    ? (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
        const distanceToEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
        const threshold = layoutMeasurement.height * onEndReachedThreshold;
        if (distanceToEnd <= threshold) {
          if (armed.current) {
            armed.current = false;
            onEndReached();
          }
        } else if (distanceToEnd > threshold * 1.5) {
          armed.current = true;
        }
      }
    : undefined;
  const pad: ViewStyle = padded ? { paddingHorizontal: 20 } : {};
  // Keep the phone-first composition: cap content to a centered ~480px column so
  // it doesn't stretch edge-to-edge on tablet/desktop (web). No-op on phones.
  const column: ViewStyle = { width: '100%', maxWidth: 480, alignSelf: 'center' };

  // When requested, split the first child off as a pinned header (only if there's
  // more than one child, so loading/empty single-child screens are unaffected).
  const kids = stickyHeader ? React.Children.toArray(children) : null;
  const header = kids && kids.length > 1 ? kids[0] : null;
  const body = header ? kids!.slice(1) : children;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.colors.bg }} edges={edges}>
      <StatusBar barStyle="light-content" backgroundColor={t.colors.accent} />
      {header ? <View style={[{ backgroundColor: t.colors.bg }, column, pad]}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ paddingBottom: 32, flexGrow: 1 }, column, pad, style]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={handleScroll ? 16 : undefined}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, column, pad, style]}>{body}</View>
      )}
      {footer ? (
        <View style={{ borderTopWidth: 1, borderColor: t.colors.line, backgroundColor: t.colors.surface, paddingTop: 12, paddingBottom: 26 }}>
          <View style={[{ paddingHorizontal: 20 }, column]}>{footer}</View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// AppBar / BackBar live in ./primitives (chamafacil-accurate versions).
