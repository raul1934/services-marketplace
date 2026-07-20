import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Chip, Icon, RequestStatus, Row, Text, useTheme } from '@chamafacil/shared';

/** Status filter buckets for the My-requests list. */
export type RequestFilter = 'all' | 'open' | 'active' | 'completed' | 'cancelled';

/** Order the filter chips appear in the sheet (and in the header indicator). */
export const REQUEST_FILTERS: RequestFilter[] = ['all', 'open', 'active', 'completed', 'cancelled'];

/** Which statuses each bucket includes; `all` matches everything. */
const BUCKETS: Record<Exclude<RequestFilter, 'all'>, RequestStatus[]> = {
  open: [RequestStatus.Open],
  active: [RequestStatus.Accepted, RequestStatus.InProgress, RequestStatus.Requote],
  completed: [RequestStatus.Completed],
  cancelled: [RequestStatus.Cancelled, RequestStatus.Expired],
};

/** True when a request of `status` should show under the selected `filter`. */
export function matchesFilter(status: RequestStatus, filter: RequestFilter): boolean {
  return filter === 'all' || BUCKETS[filter].includes(status);
}

/**
 * Bottom sheet for filtering the My-requests list by status. Single-select:
 * tapping a chip applies the filter and closes the sheet (`all` clears it).
 */
export function RequestFilterSheet({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: RequestFilter;
  onChange: (f: RequestFilter) => void;
  onClose: () => void;
}) {
  const t = useTheme();

  // Modals render outside the screen's SafeAreaView, so the sheet has to

  // clear Android's navigation bar itself.

  const insets = useSafeAreaInsets();
  const { t: tr } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 + insets.bottom, gap: 18 }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.colors.line }} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="h3">{tr('requests.filterTitle')}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={tr('common.close')} hitSlop={8}>
              <Icon name="close" size={22} color={t.colors.ink3} />
            </Pressable>
          </Row>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {REQUEST_FILTERS.map((f) => (
              <Chip
                key={f}
                label={tr(`requests.status.${f}`)}
                active={f === value}
                onPress={() => {
                  onChange(f);
                  onClose();
                }}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
