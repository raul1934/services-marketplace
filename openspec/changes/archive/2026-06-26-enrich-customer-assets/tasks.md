# Tasks — enrich customer assets

## 1. Vehicle make/model catalog (`backend`)
- [x] 1.1 Migration: `vehicle_makes` (id, name unique, `kind` car|moto, timestamps) + `vehicle_models` (id, vehicle_make_id fk cascade, name, timestamps, unique(make, name)).
- [x] 1.2 Models `VehicleMake` (hasMany models) + `VehicleModel` (belongsTo make).
- [x] 1.3 Vendor the dataset JSON under `database/data/` — cars (`matthlavacka/car-list` / `getFrontend/json-car-list`) **+ a motorcycle make/model list**.
- [x] 1.4 `VehicleCatalogSeeder` (idempotent upsert); register in `DatabaseSeeder` before `AssetSeeder`.
- [x] 1.5 `VehicleMakeController@index` + `VehicleMakeResource` → `GET vehicle-makes` (makes-with-models); route in `customer_api.php`.

## 2. Polymorphic asset detail model (`backend`)
- [x] 2.1 Migrations: `asset_vehicles` (make/model fks + plate, color, year, current_mileage, fuel, chassis), `asset_properties` (kind, unit, size, address, floor, condo), `asset_pets` (species, breed, size, birthdate, weight, vaccines, microchip); alter `assets` — add `detailable_type`/`detailable_id`, drop `attributes`.
- [x] 2.2 Models `AssetVehicle` (belongsTo make/model), `AssetProperty`, `AssetPet`; `Asset::detailable(): MorphTo` + `deleting` hook to cascade the detail.
- [x] 2.3 Register `Relation::morphMap(['vehicle'=>…, 'property'=>…, 'pet'=>…])` in `AppServiceProvider` (additive; no `enforceMorphMap`).
- [x] 2.4 `AssetController` store/update: per-type validation map; create/update the typed detail row + asset in a transaction; vehicle validates `vehicle_make_id`/`vehicle_model_id` (exist + model-belongs-to-make).
- [x] 2.5 `AssetResource` loads `detailable` and serializes via per-type detail resources; `AssetVehicleResource` resolves `make`/`model` names + emits the raw ids.
- [x] 2.6 Rewrite `AssetSeeder`: create `AssetVehicle` rows with catalog-looked-up make/model ids, then the assets.

## 3. Mileage readings (`backend`)
- [x] 3.1 Migration `asset_readings` (asset_id fk cascade, service_request_id fk nullOnDelete nullable, mileage uint, recorded_at, note nullable, recorded_by_id nullable, `source` enum customer|provider); `AssetReading` model; `Asset::readings(): HasMany` (latest first).
- [x] 3.2 Shared `AssetReadingService::record` (transaction): insert reading + `current_mileage = max(current, mileage)`; used by both endpoints.
- [x] 3.3 Customer `AssetController@addReading` → `POST assets/{asset}/readings` (owner-authorized, `source=customer`, optional `service_request_id` must belong to the asset). Vehicle create with an initial mileage records the first reading.
- [x] 3.4 Provider odometer endpoint → `POST requests/{serviceRequest}/odometer` (authorized to the accepted provider, `source=provider`, ties to the request + its vehicle asset; 422 if no vehicle asset); route in `provider_api.php`.
- [x] 3.5 `AssetResource` vehicle detail exposes `current_mileage`; an `AssetReadingResource` (incl. `source`) for the timeline.

## 4. Photo + history (`backend`)
- [x] 4.1 `Asset::serviceRequests(): HasMany` (inverse of `ServiceRequest::asset()`).
- [x] 4.2 `AssetController@photo`: validate `photo` (`image`,`max:5120`), store to `assets` on `public`, replace prior `photo_path`, return `AssetResource`.
- [x] 4.3 `AssetController@history`: authorize owner, paginated `ServiceRequestResource::collection` (`with('category')->latest()`, `perPage`).
- [x] 4.4 Routes: `POST assets/{asset}/photo`, `GET assets/{asset}/history`.
- [x] 4.5 `php artisan migrate:fresh --seed` clean; `php artisan test` green (ignore pre-existing `ExampleTest`).

## 5. Shared + fields + i18n (`frontend`)
- [x] 5.1 Shared `Asset` type: replace `attributes` with typed `detail` (per type); vehicle detail adds `vehicle_make_id`/`vehicle_model_id` + resolved `make`/`model` + `current_mileage`. Add an `AssetReading` type. Update create/update payload types.
- [x] 5.2 `assetFields.ts`: per-type free-text fields (vehicle: plate, color, year, fuel, chassis — **mileage excluded**, it's readings-only; property: kind, unit, size, address, floor, condo; pet: species, breed, size, birthdate, weight, vaccines, microchip). make/model handled by the picker.
- [x] 5.3 i18n `pt-BR.json` + `en-US.json`: all new `assets.fields.*` labels; `make` → "Marca"/"Make", `model` → "Modelo"/"Model"; mileage/reading strings ("Km atual", "Registrar km", "Histórico de km").

## 6. Make/model picker + photo (client) (`apps/customer`)
- [x] 6.1 `api.ts`: `vehicleCatalogApi.makes()`; `queries.ts`: `useVehicleMakes()` (long `staleTime`).
- [x] 6.2 `MakeModelPicker`: search makes → dependent models; writes `vehicle_make_id`/`vehicle_model_id` (no free text; both nullable).
- [x] 6.3 `api.ts`: `assetsApi.uploadPhoto(id, form)`; `queries.ts`: `useUploadAssetPhoto(id)` invalidating `['asset', id]` + `['assets']`.
- [x] 6.4 `new.tsx`/`[id]/edit.tsx`: render the picker for vehicle, plain `Field`s for the rest, optional photo picker, optional initial mileage on add; add-flow creates then uploads the photo before `router.replace`.

## 7. Detail view + history + readings + filter (`apps/customer`)
- [x] 7.1 Restructure `app/assets/[id].tsx` → `app/assets/[id]/edit.tsx` (form + change-photo) and new `app/assets/[id]/index.tsx` (detail: photo + nickname + type, read-only characteristics, "Edit" → edit route).
- [x] 7.2 `queries.ts`: `useAssetHistory(id)` (`useInfiniteQuery`); `api.ts`: `assetsApi.history(id, page)`. Detail renders history inline (paginates via `Screen onEndReached`), `EmptyState` when empty.
- [x] 7.3 Readings: `api.ts` `assetsApi.addReading`/`readings`; `queries.ts` `useAddReading(id)` + `useAssetReadings(id)`. Detail shows `current_mileage` + a "Registrar km" sheet (mileage, optional service link, note) + the readings timeline, each entry tagged by `source` (oficina/você) and linked service.
- [x] 7.4 `index.tsx`: read `detail` (not `attributes`) for the caption + photo thumbnail; type filter chip row (All/Vehicle/Property/Pet) via `useAssets(type)`.
- [x] 7.5 Update the request-creation wizard asset picker (`request/new.tsx`) to read `detail` instead of `attributes`.

## 8. Provider odometer (`apps/provider`)
- [x] 8.1 `api.ts`: `providerApi.recordOdometer(reqId, payload)`; `queries.ts`: `useRecordOdometer(reqId)` invalidating the job query.
- [x] 8.2 Job report screen: an odometer affordance (mileage + optional note), shown only when the job's request has a vehicle asset; + i18n.

## 9. Verification
- [x] 9.1 Backend: `migrate:fresh --seed` populates the catalog (cars+motos) and `AssetSeeder` writes detail rows + make/model ids; `GET vehicle-makes` returns nested makes+models; create a vehicle asset (with make/model ids + detail fields) persists across the typed tables and the resource returns resolved names; a model not belonging to the make is rejected; `POST assets/{id}/photo` returns `photo_url`; `GET assets/{id}/history` returns `{data,meta}`; non-owner → 403; `php artisan test` green.
- [x] 9.2 Readings (both sources): customer `POST assets/{id}/readings` inserts a `source=customer` row and bumps `current_mileage`; provider `POST requests/{id}/odometer` (as the accepted provider) inserts a `source=provider` row tied to the request's asset and bumps it; a non-accepted provider → 403; a request with no vehicle asset → 422; a second lower reading is logged but `current_mileage` does not drop; the readings list returns the log newest-first with both sources.
- [x] 9.3 `tsc --noEmit` for `packages/shared` + `apps/customer` + `apps/provider` clean (only documented pre-existing errors).
- [x] 9.4 Playwright (phone viewport): customer adds a vehicle (make→model from the catalog, extra fields, photo, initial km); list shows photo, full caption, filters by type; detail shows characteristics, current km, history; customer records a new km → current updates and a timeline entry appears; provider records the odometer on a job → it appears in the owner's timeline tagged "oficina" and bumps current; edit changes a field and the photo.
- [x] 9.5 Walk every requirement in the delta spec with evidence.
