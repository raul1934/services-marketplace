import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePetSpecies } from '../queries';
import { LinkedPicker, LinkedItem } from './LinkedPicker';

/** Pet species→breed picker (ids only). Wraps the generic `LinkedPicker`. */
export function PetSpeciesBreedPicker({
  speciesId,
  breedId,
  onChange,
}: {
  speciesId: number | null;
  breedId: number | null;
  onChange: (v: { pet_species_id: number | null; pet_breed_id: number | null }) => void;
}) {
  const { t: tr } = useTranslation();
  const { data: species = [] } = usePetSpecies();

  const items: LinkedItem[] = useMemo(
    () => species.map((s) => ({ id: s.id, name: s.name, children: s.breeds })),
    [species],
  );

  return (
    <LinkedPicker
      items={items}
      parentId={speciesId}
      childId={breedId}
      onChange={({ parentId, childId }) => onChange({ pet_species_id: parentId, pet_breed_id: childId })}
      labels={{
        parent: tr('assets.species'),
        child: tr('assets.breed'),
        selectParent: tr('assets.selectSpecies'),
        selectChild: tr('assets.selectBreed'),
        childNeedsParent: tr('assets.breedNeedsSpecies'),
        searchParent: tr('assets.searchSpecies'),
        searchChild: tr('assets.searchBreed'),
      }}
    />
  );
}
