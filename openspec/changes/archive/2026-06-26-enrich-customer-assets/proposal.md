# Enrich customer assets with more information

## Why

The customer "assets" feature (Meus ativos / R6 — the *fosso*) is thin and its
data model is a loose JSON blob. Each asset stores its type-specific details in a
single `attributes` `json` column, which means no typed columns, no FK integrity,
nothing queryable, and a UI that captures only a handful of fields. On top of
that:

- The list cannot be filtered, and `/assets/[id]` is an **edit form only** — there
  is no detail view, despite the empty-state copy promising the asset is where you
  "consolidate its history".
- The list caption reads `attributes.make`
  ([index.tsx:49](frontend/apps/customer/app/assets/index.tsx#L49)) but the form's
  only brand field is `model`, labelled "Make & model"
  ([assetFields.ts:10](frontend/apps/customer/src/assetFields.ts#L10)) — so the
  brand is never editable, and there is no canonical make/model catalog (data is
  inconsistent: "VW" vs "Volkswagen").
- `photo_path` / `photo_url` already exist
  ([AssetResource.php:18](backend/app/Http/Resources/AssetResource.php#L18)) but
  no endpoint accepts an upload and no screen shows it.

## What changes

**1. Polymorphic, typed asset model (the core re-architecture).** Replace the
`attributes` JSON blob with a proper schema: `Asset` gains a `morphTo`
relation `detailable`, and each type's characteristics live in their own typed
table.

```
assets            id, user_id, type, nickname, photo_path, archived_at,
                  detailable_type, detailable_id, timestamps   (attributes column dropped)
asset_vehicles    id, vehicle_make_id (fk), vehicle_model_id (fk), plate, color,
                  year, current_mileage, fuel, chassis, timestamps
asset_properties  id, kind, unit, size, address, floor, condo, timestamps
asset_pets        id, species, breed, size, birthdate, weight, vaccines,
                  microchip, timestamps
```

`Asset::detailable()` is the `morphTo`; `AssetVehicle` / `AssetProperty` /
`AssetPet` are the detail models. A `Relation::morphMap` aliases the morph type to
the `AssetType` values (`vehicle` / `property` / `pet`) so `detailable_type` stays
clean and matches `type`. `AssetController` create/update build the typed detail
row (per-type validation) then the asset that points to it; `AssetResource`
serializes the loaded detail.

**2. Seeded make/model catalog, referenced by id.** Add reference tables
`vehicle_makes` + `vehicle_models` (with a `kind` of car/moto), seeded from a
bundled JSON dataset (`matthlavacka/car-list` / `getFrontend/json-car-list` for
cars — incl. the Brazilian market — **merged with a motorcycle list**, since the
vehicle type covers motos and there's no free-text escape). `GET vehicle-makes`
returns makes-with-models; the vehicle form's **Make** / **Model** are searchable
pickers (Model scoped to Make). The selection is stored **by id**
(`asset_vehicles.vehicle_make_id` / `vehicle_model_id`), and `AssetResource`
resolves them to names so the list caption keeps working.

**3. Richer fields per type.** The new typed columns above capture far more than
today: vehicle gains mileage / fuel / chassis; property gains address / floor /
condo; pet gains birthdate / weight / vaccines / microchip. The `assetFields.ts`
config + i18n drive the add/edit UI per type.

**3b. Vehicle mileage as a current value + intact history, recorded by both
sides.** Mileage is *not* a mutable field that gets overwritten.
`asset_vehicles.current_mileage` holds the latest known odometer (the "km atual"
shown), backed by an append-only `asset_readings` log (`asset_id`, optional
`service_request_id`, `mileage`, `recorded_at`, `note`, `recorded_by_id`,
`source`). Recording a reading inserts a row and bumps `current_mileage =
max(current, new)`; editing the asset's other fields never touches readings. Two
capture points, both persisted and both shown in the timeline:
- **Provider** records the odometer during the service (e.g. at an oil change)
  from the job report — `POST requests/{serviceRequest}/odometer` (authorized to
  the accepted provider; the reading is tied to that request + its vehicle asset,
  `source = provider`).
- **Customer** records it from their own car on the asset detail —
  `POST assets/{asset}/readings` (`source = customer`, optionally linked to one of
  their own service requests).

Both go through the same record-reading action and feed the same asset, so the
asset's km timeline shows readings from the shop and from the owner side by side.

**4. Asset photo.** Add `POST assets/{asset}/photo` (single image, matches the
avatar/document pattern — `->store('assets','public')` into `photo_path`,
replacing any prior file). Wire pick-and-upload into add/edit, and show the photo
(type-icon fallback) on the list and detail.

**5. Real detail view with service history.** Split `/assets/[id]` into a
**detail** view (photo, read-only characteristics, service history) and a separate
**edit** screen. Add `GET assets/{asset}/history` returning the asset's
`service_requests` (linked via `service_requests.asset_id`), paginated
newest-first, reusing `ServiceRequestResource`.

**6. Filters on the assets list.** Add a type filter (All / Vehicle / Property /
Pet) to Meus ativos, server-backed via the `?type=` parameter `GET assets`
already accepts, as a chip row in the list header.

## Impact

- **Affected specs**: `customer`, `provider`
- **Affected code**:
  - Backend — migrations: 3 detail tables + `vehicle_makes`/`vehicle_models` +
    `asset_readings`, and altering `assets` (drop `attributes`, add
    `detailable_type`/`detailable_id`); models `AssetVehicle`/`AssetProperty`/
    `AssetPet`, `VehicleMake`/`VehicleModel`, `AssetReading`, `Asset` relations
    (`detailable`, `serviceRequests`, `readings`); a `morphMap` registration; a
    shared "record reading" action (insert + bump `current_mileage`) used by both
    sides; `VehicleCatalogSeeder` + bundled JSON, `AssetSeeder` rewritten;
    `AssetController` (per-type create/update, +`photo`, +`history`, +`addReading`);
    a provider odometer endpoint (`POST requests/{serviceRequest}/odometer`);
    `AssetResource` (+ per-type detail resources, + readings); `VehicleMakeController`
    + resource; `customer_api.php` (4 routes) + `provider_api.php` (1 route).
  - Shared — `Asset` type reshaped (typed `detail` + `vehicle_make_id`/
    `vehicle_model_id` + resolved make/model names + `current_mileage` instead of
    `attributes`); an `AssetReading` type.
  - Customer app — `assetFields.ts`, `app/assets/index.tsx` (+filter),
    `app/assets/new.tsx`, `app/assets/[id].tsx` → `app/assets/[id]/index.tsx` +
    `app/assets/[id]/edit.tsx`, a make/model picker, the readings UI, `src/api.ts`,
    `src/queries.ts`, i18n `pt-BR.json` + `en-US.json`.
  - Provider app — an odometer affordance in the job report flow (`src/api.ts`,
    `src/queries.ts`, the job screen) + i18n.
- **DB**: several additive migrations + one `assets` alter (drops the unused-going-
  forward `attributes` column). Dev resets via `migrate:fresh --seed`.
- **API contract change**: asset create/update and read move from a flat
  `attributes` map to a typed per-type detail shape (+ `vehicle_make_id` /
  `vehicle_model_id`). All consumers (the two asset screens + the request wizard's
  asset picker) are updated in the same change.
- **Out of scope**: FIPE-grade trim/year/price data (make + model names only),
  multi-photo galleries (single photo), editing/filing requests from the history
  list, a provider-side full asset view (the provider only records the odometer on
  the job, not browse the owner's assets), reading mileage for non-vehicle types,
  and any backfill of old `attributes` JSON into the typed tables (dev data is
  reseeded).
