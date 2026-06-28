# Tasks — asset catalogs + car brand logos

## 1. Property type catalog (`backend`)
- [x] 1.1 Migration `property_types` (id, name unique, timestamps); add `property_type_id` FK to `asset_properties`, drop `kind`.
- [x] 1.2 `PropertyType` model; `AssetProperty` belongsTo `propertyType`.
- [x] 1.3 `PropertyTypeSeeder` (fixed BR list); register in `DatabaseSeeder`.
- [x] 1.4 `PropertyTypeController@index` + `PropertyTypeResource` → `GET property-types`; route.
- [x] 1.5 `AssetPropertyResource` resolves `kind` ← `propertyType?->name` (+ raw `property_type_id`).

## 2. Pet species + breed catalog (`backend`)
- [x] 2.1 Migrations `pet_species` + `pet_breeds` (breed→species, unique(species,name)); add `pet_species_id`/`pet_breed_id` FKs to `asset_pets`, drop `species`/`breed`.
- [x] 2.2 Models `PetSpecies` (hasMany breeds), `PetBreed` (belongsTo species); `AssetPet` belongsTo species + breed.
- [x] 2.3 Vendor `database/data/pet-breeds.json` (`[{species, breeds:[]}]`, dog/cat from a public dataset) + species list; `PetCatalogSeeder` (idempotent) before `AssetSeeder`.
- [x] 2.4 `PetSpeciesController@index` + `PetSpeciesResource` (breeds nested) → `GET pet-species`; route.
- [x] 2.5 `AssetPetResource` resolves `species`/`breed` (+ raw ids).

## 3. Car brand logos (`backend`)
- [x] 3.1 Migration: add `logo_path` to `vehicle_makes`.
- [x] 3.2 Vendor `filippofilip95/car-logos-dataset` optimized PNGs + `data.json` under `database/data/car-logos/`; publish to the `public` disk.
- [x] 3.3 Extend `VehicleCatalogSeeder` to set `logo_path` by slug-matching make name against the dataset's `slug` (misses → null).
- [x] 3.4 `VehicleMakeResource` adds `logo_url`.

## 4. AssetController validation (`backend`)
- [x] 4.1 Per-type rules: property `property_type_id`; pet `pet_species_id` + `pet_breed_id` (belongs-to-species check, reusing the make/model helper).
- [x] 4.2 `detailColumns` maps the new ids; remove dropped free-text keys.
- [x] 4.3 `php artisan migrate:fresh --seed` clean; feature tests (create property with type id; create pet with species+breed id; breed-not-in-species → 422; `GET property-types`/`pet-species` shape) green.

## 5. Frontend — pickers + catalogs (`apps/customer`)
- [x] 5.1 Refactor `MakeModelPicker` → generic `LinkedPicker` (parent→child, ids, optional per-parent logo node) + `SinglePicker` (flat id list).
- [x] 5.2 `api.ts`/`queries.ts`: `propertyTypesApi`/`usePropertyTypes`, `petSpeciesApi`/`usePetSpecies`; `VehicleMake` type gains `logo_url`; detail types add the id/name fields.
- [x] 5.3 Logo rendering: `LinkedPicker` shows `logoUrl` via `Image` (`resizeMode="contain"`), car-icon fallback; vehicle detail header shows the make logo.
- [x] 5.4 `new.tsx`/`edit.tsx`: `LinkedPicker` for pet species→breed, `SinglePicker` for property type; vehicle make→model uses the same `LinkedPicker` with logos.
- [x] 5.5 `assetFields.ts`: drop `kind`/`species`/`breed`; i18n labels for species/breed/property type + picker placeholders.

## 6. Verification
- [x] 6.1 Backend: `migrate:fresh --seed` populates the 3 catalogs + sets some `logo_path`; endpoints return expected shapes; per-type id validation + belongs-to checks pass; `php artisan test` green.
- [x] 6.2 `tsc --noEmit` (shared + customer) clean (only known pre-existing errors).
- [x] 6.3 Playwright: add a property (pick type), a pet (pick species→breed); vehicle make picker shows logos; captions/detail resolve names; zero console errors.
- [x] 6.4 Walk every delta requirement with evidence.
