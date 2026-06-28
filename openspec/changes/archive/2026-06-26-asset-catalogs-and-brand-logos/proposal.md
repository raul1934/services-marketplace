# Asset catalogs (property type, pet species/breed) + car brand logos

## Why

The vehicle make/model is now a seeded catalog referenced by id, but the other
type-specific "category" fields are still free text:
- Property `kind` ("tipo de imóvel") — typed freely.
- Pet `species` ("tipo de animal") and `breed` ("raça") — typed freely.

This is the same inconsistency the vehicle catalog solved ("Apto" vs "Apartamento",
"Labrador" vs "Lab"). The user wants these to be **id-referenced catalogs** too,
with **breed scoped to species** (exactly like model scoped to make).

Separately, the make picker is text-only — adding each car make's **logo** gives
it visual identity and makes the picker far easier to scan.

## What changes

**1. Property type catalog (by id).** New `property_types` table + seeder
(Apartamento, Casa, Cobertura, Kitnet/Studio, Sobrado, Sala comercial, Loja,
Galpão, Terreno, Chácara/Sítio, Garagem/Vaga, …). `asset_properties.property_type_id`
FK replaces the free-text `kind`. New `GET property-types`. Single-select picker.

**2. Pet species + breed catalogs (by id, breed→species).** New `pet_species`
(Cão, Gato, Ave, Roedor, Réptil, Peixe, Cavalo, Outro) and `pet_breeds`
(`pet_species_id` FK), seeded from a vendored dog/cat breed dataset.
`asset_pets.pet_species_id` + `pet_breed_id` FKs replace free-text `species`/`breed`.
New `GET pet-species` (breeds nested, like `vehicle-makes`). Two-level picker
(species → breed); breed optional and scoped to the chosen species.

**3. Car brand logos.** Add `vehicle_makes.logo_path`, seeded by matching each make
to a **vendored logo set** (`filippofilip95/car-logos-dataset`, MIT — 387 PNG
logos, broad coverage incl. BR brands). `vehicle-makes` returns `logo_url`; the
make picker (and the vehicle asset header) render the logo via `Image`, with the
generic car icon as fallback for makes without a logo.

The make/model picker is generalized into a reusable **two-level picker** (used by
both vehicle make→model and pet species→breed) plus a **single-select picker**
(property type).

## Logo source — decided

**PNG, `filippofilip95/car-logos-dataset` (MIT, 387 logos)** — chosen for coverage
(incl. more BR brands) over true-vector. Rendered via `Image`; makes absent from
the set fall back to the generic car icon. (The SVG option `dangnelson/car-makes-icons`
covered only ~60 car makes, so it was dropped.)

## Impact

- **Affected specs**: `customer`
- **Affected code**:
  - Backend — migrations: `property_types`, `pet_species` + `pet_breeds`, add
    `logo_path` to `vehicle_makes`, add FK columns to `asset_properties`/`asset_pets`
    and drop free-text `kind`/`species`/`breed`; models; seeders + vendored data
    (logos, breeds, property types); resources (`logo_url`, nested breeds, resolved
    names); `PropertyTypeController`, `PetSpeciesController`; `AssetController`
    per-type validation (`property_type_id`, `pet_species_id`/`pet_breed_id` with
    belongs-to checks); routes.
  - Customer app — generalize `MakeModelPicker` → `LinkedPicker` + add
    `SinglePicker`; `useVehicleMakes` exposes `logo_url`; new `usePropertyTypes`,
    `usePetSpecies`; `new.tsx`/`edit.tsx` use pickers for property type & species/
    breed; `assetFields.ts` drops `kind`/`species`/`breed`; shared/customer types;
    i18n.
- **DB**: additive migrations + 3 dropped free-text columns. Dev reseeds;
  `AssetSeeder` only seeds vehicles, so no pet/property data to migrate.
- **API additions** (no breaking change to existing endpoints): `GET property-types`,
  `GET pet-species`; `vehicle-makes` gains `logo_url`; asset create/update accept
  `property_type_id` / `pet_species_id` / `pet_breed_id`.
- **Out of scope**: logos for brands absent from the chosen set (icon fallback);
  exhaustive breed lists for non-dog/cat species (those species pick is enough,
  breed optional); editing the catalogs from the app (seed-only).
