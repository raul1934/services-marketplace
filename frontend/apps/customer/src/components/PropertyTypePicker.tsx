import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePropertyTypes } from '../queries';
import { SinglePicker } from './SinglePicker';

/** Property-type picker (id only). Wraps the generic `SinglePicker`. */
export function PropertyTypePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const { t: tr } = useTranslation();
  const { data: types = [] } = usePropertyTypes();

  return (
    <SinglePicker
      label={tr('assets.fields.kind')}
      items={types}
      value={value}
      onChange={onChange}
      placeholder={tr('assets.selectType')}
      searchPlaceholder={tr('assets.searchType')}
    />
  );
}
