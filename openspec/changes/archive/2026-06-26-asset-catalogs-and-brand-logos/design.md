# Design — asset catalogs + car brand logos

Mirrors the established vehicle make/model catalog: seeded reference tables,
id-only references on the typed detail rows, names resolved in the resource, and
catalog endpoints cached client-side.

## Schema

```
property_types        id, name (unique), timestamps
pet_species           id, name (unique), timestamps
pet_breeds            id, pet_species_id (fk cascade), name, timestamps,
                      unique(pet_species_id, name)

asset_properties      + property_type_id (fk property_types, nullOnDelete)
                      - kind            (dropped)
asset_pets            + pet_species_id  (fk pet_species, nullOnDelete)
                      + pet_breed_id    (fk pet_breeds, nullOnDelete)
                      - species, breed  (dropped)
vehicle_makes         + logo_path       (string, nullable)
```

`size` stays a free-text column on pets/properties (it's a measurement, not a
category). Only the category fields the user named become catalogs.

## Backend

- **Models**: `PropertyType`, `PetSpecies` (hasMany breeds), `PetBreed` (belongsTo
  species). `AssetProperty` belongsTo `propertyType`; `AssetPet` belongsTo
  `species` + `breed`. `VehicleMake` exposes `logo_url` (accessor off `logo_path`).
- **Resources**: `AssetPropertyResource` resolves `kind` ← `propertyType?->name`
  (+ raw `property_type_id`); `AssetPetResource` resolves `species`/`breed`
  (+ raw ids). `VehicleMakeResource` adds `logo_url`. New `PropertyTypeResource`,
  `PetSpeciesResource` (breeds nested via `whenLoaded`).
- **Endpoints** (customer, authed): `GET property-types`, `GET pet-species`
  (species with breeds). Small reference sets → returned once, cached client-side
  with a long `staleTime`.
- **Validation** (`AssetController` per-type rules):
  - property: `property_type_id` → `nullable|exists:property_types,id`.
  - pet: `pet_species_id` → `nullable|exists:pet_species,id`; `pet_breed_id` →
    `nullable|exists:pet_breeds,id` + must belong to the species (same helper as
    model-belongs-to-make).
  - `detailColumns` maps these ids onto the detail row; the dropped free-text keys
    are removed from the rules/columns.
- **Seeders**:
  - `PropertyTypeSeeder` — a fixed BR list.
  - `PetCatalogSeeder` — species list + dog/cat breeds from a vendored JSON
    (`database/data/pet-breeds.json`, shaped `[{species, breeds:[]}]`), idempotent
    upsert; wired before `AssetSeeder`.
  - `VehicleCatalogSeeder` — extended to set `logo_path` by matching make name to a
    vendored logo set (slugified name → file). Logos vendored under
    `database/data/car-logos/` (or `storage/app/public/car-logos`), exposed via a
    stable URL. Unmatched makes keep `logo_path = null`.

## Car brand logos

- **Source**: `filippofilip95/car-logos-dataset` (MIT) — 387 PNG logos + a
  `data.json` of `{name, slug, image:{...}}`. Use the optimized PNGs.
- **Storage**: vendor the PNGs in the repo and publish to the `public` disk (like
  asset photos); `logo_path` holds the disk path, `logo_url` the public URL.
  Matching is by slug of the make name against the dataset's `slug`; misses → null.
- **Rendering**: the make picker (and vehicle asset header) render `logo_url` via
  `Image` (~24–28px, `resizeMode="contain"`), with the existing car icon as
  fallback when `logo_url` is null.

## Frontend — generalized pickers

`MakeModelPicker` is refactored into reusable pieces:

- **`LinkedPicker`** — parent → dependent child, ids only, optional per-parent
  `logoUrl` (rendered with `Image`). Props: `parentLabel/childLabel`, `items: {id,name,logoUrl?,children:[{id,name}]}[]`,
  `parentId/childId`, `onChange({parentId, childId})`, placeholders. Used by:
  - vehicle: items = makes (with `logoUrl`), children = models → writes
    `vehicle_make_id` / `vehicle_model_id`.
  - pet: items = species, children = breeds → writes `pet_species_id` /
    `pet_breed_id`.
- **`SinglePicker`** — flat id list (search + select). Used by property type →
  writes `property_type_id`.

`new.tsx` / `edit.tsx`: render `LinkedPicker` for vehicle (as today) and for pet
(species→breed); `SinglePicker` for property `kind`. `assetFields.ts` drops
`kind`, `species`, `breed` (now pickers); the remaining free-text fields (size,
address, weight, …) stay. The detail screen reads the resolved `kind`/`species`/
`breed` names (no change to its caption logic).

`queries.ts` / `api.ts`: `usePropertyTypes()`, `usePetSpecies()`,
`propertyTypesApi`, `petSpeciesApi`; `VehicleMake` type gains `logo_url`.

## Risks / edge cases

- **Logo coverage.** Even the 387-logo set won't cover every motorcycle/niche
  brand → generic-icon fallback (no breakage). Logos are decorative; the picker
  works without them.
- **Species without seeded breeds** (e.g. Ave/Réptil). Breed picker shows an empty
  list and stays optional — the user can save species only.
- **Dropped free-text columns.** No data migration needed: only vehicles are
  seeded, and dev runs `migrate:fresh --seed`. (Pets/properties created via the app
  before this change would lose their free-text kind/species/breed — acceptable in
  dev; a backfill would be a separate change if ever shipped.)
- **Catalog payload size.** Pet species + dog/cat breeds (~few hundred) and
  property types (~15) are small; returned once and cached, like `vehicle-makes`.
