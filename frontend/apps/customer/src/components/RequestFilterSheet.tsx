import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Chip, Sheet } from '@chamafacil/shared';
import { RequestStatusFilter } from '../api';

/**
 * Status filter buckets for the My-requests list. `all` is the "no filter"
 * option; the others are sent to the API as `?status=`, which owns the
 * bucket → statuses mapping (there is no client-side equivalent, on purpose).
 */
export type RequestFilter = 'all' | RequestStatusFilter;

/** Order the filter chips appear in the sheet (and in the header indicator). */
export const REQUEST_FILTERS: RequestFilter[] = ['all', 'open', 'active', 'completed', 'cancelled'];

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
  const { t: tr } = useTranslation();

  return (
    <Sheet visible={visible} onClose={onClose} title={tr('requests.filterTitle')} closeLabel={tr('common.close')}>

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
    </Sheet>
  );
}
