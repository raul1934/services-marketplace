import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useVehicleMakes } from '../queries';
import { LinkedPicker, LinkedItem } from './LinkedPicker';

/**
 * Vehicle make→model picker (ids only, with brand logos). Thin wrapper that
 * feeds the seeded catalog into the generic `LinkedPicker`.
 */
export function MakeModelPicker({
  makeId,
  modelId,
  onChange,
}: {
  makeId: number | null;
  modelId: number | null;
  onChange: (v: { vehicle_make_id: number | null; vehicle_model_id: number | null }) => void;
}) {
  const { t: tr } = useTranslation();
  const { data: makes = [] } = useVehicleMakes();

  const items: LinkedItem[] = useMemo(
    () => makes.map((m) => ({ id: m.id, name: m.name, logoUrl: m.logo_url, children: m.models })),
    [makes],
  );

  return (
    <LinkedPicker
      items={items}
      parentId={makeId}
      childId={modelId}
      onChange={({ parentId, childId }) => onChange({ vehicle_make_id: parentId, vehicle_model_id: childId })}
      labels={{
        parent: tr('assets.make'),
        child: tr('assets.model'),
        selectParent: tr('assets.selectMake'),
        selectChild: tr('assets.selectModel'),
        childNeedsParent: tr('assets.modelNeedsMake'),
        searchParent: tr('assets.searchMake'),
        searchChild: tr('assets.searchModel'),
      }}
    />
  );
}
