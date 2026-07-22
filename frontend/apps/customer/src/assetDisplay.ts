import { IconName } from '@chamafacil/shared';
import { Asset } from './api';

/** Asset type → icon name. Single source for every surface that draws an asset:
 *  list, detail, selector, creation flow and review row. Add new types here only —
 *  a local copy silently drifts and leaves one screen showing the wrong glyph. */
export const ICON: Record<string, IconName> = { vehicle: 'car', property: 'home', pet: 'paw' };

/**
 * One-line caption from an asset's detail (make/model/plate/kind/unit/species/
 * breed), falling back to the translated type label when no detail is set.
 */
export function assetCaption(a: Asset, tr: (key: string) => string): string {
  const d = a.detail ?? {};
  // `kind` is stored as the raw token the API speaks ('car' / 'motorcycle').
  // It sat in this list for a long time without ever being set, so nothing
  // showed; the moment the request flow started filling it, cards began
  // reading "Aprilia · motorcycle" — an English word in a Portuguese UI.
  const kind = d.kind ? tr(`assets.vehicleKind.${d.kind}`) : null;
  return (
    [d.make, d.model, d.plate, kind, d.unit, d.species, d.breed].filter(Boolean).join(' · ') ||
    tr(`assets.type.${a.type}`)
  );
}
