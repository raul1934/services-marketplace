/** Per-type free-text catalog fields for the asset add/edit screens
 *  (R-CUSTOMIZAÇÃO: structured attributes, not hardcoded domain strings in the
 *  UI). Labels come from i18n at `assets.fields.<key>`.
 *
 *  Vehicle make/model are NOT here — they are chosen via the catalog picker
 *  (`MakeModelPicker`, stored as ids). Vehicle mileage is NOT here either — it is
 *  shown read-only as `current_mileage` and changed only via odometer readings. */
export type AssetTypeKey = 'vehicle' | 'property' | 'pet';

export const ASSET_TYPES: AssetTypeKey[] = ['vehicle', 'property', 'pet'];

export const ASSET_FIELDS: Record<AssetTypeKey, { key: string; placeholder: string; keyboardType?: 'numeric' | 'default' }[]> = {
  vehicle: [
    { key: 'plate', placeholder: 'ABC1D23' },
    { key: 'color', placeholder: 'Prata' },
    { key: 'year', placeholder: '2019', keyboardType: 'numeric' },
    { key: 'fuel', placeholder: 'Flex' },
    { key: 'chassis', placeholder: '9BWZZZ...' },
  ],
  // Property type is a catalog picker (PropertyTypePicker); the rest are free text.
  property: [
    { key: 'unit', placeholder: 'Apto 502' },
    { key: 'size', placeholder: '70 m²' },
    { key: 'address', placeholder: 'Rua das Flores, 100' },
    { key: 'floor', placeholder: '5º andar' },
    { key: 'condo', placeholder: 'Ed. Primavera' },
  ],
  // Species/breed are catalog pickers (PetSpeciesBreedPicker); the rest are free text.
  pet: [
    { key: 'size', placeholder: 'Médio' },
    { key: 'birthdate', placeholder: '2021' },
    { key: 'weight', placeholder: '12 kg' },
    { key: 'vaccines', placeholder: 'V10, antirrábica' },
    { key: 'microchip', placeholder: '982000...' },
  ],
};
