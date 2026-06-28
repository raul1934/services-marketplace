import { Asset } from './api';

/** Asset type → icon name (shared by the asset list, selector, and review row). */
export const ICON: Record<string, string> = { vehicle: 'car', property: 'home', pet: 'paw' };

/**
 * One-line caption from an asset's detail (make/model/plate/kind/unit/species/
 * breed), falling back to the translated type label when no detail is set.
 */
export function assetCaption(a: Asset, tr: (key: string) => string): string {
  const d = a.detail ?? {};
  return (
    [d.make, d.model, d.plate, d.kind, d.unit, d.species, d.breed].filter(Boolean).join(' · ') ||
    tr(`assets.type.${a.type}`)
  );
}
