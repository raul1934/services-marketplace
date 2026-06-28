# Design — enrich customer assets

## Polymorphic asset detail model

Today an asset is `{ type, nickname, attributes: json, photo_path }`. We replace
the `attributes` blob with a `morphTo` and one typed table per type. Morphs are an
established pattern in this codebase (`Media` is polymorphic), so this fits.

### Schema

```
assets
  id, user_id, type (enum vehicle|property|pet), nickname, photo_path,
  archived_at, detailable_type, detailable_id, timestamps
  -- `attributes` json column is dropped

asset_vehicles
  id, vehicle_make_id (fk vehicle_makes, nullOnDelete),
  vehicle_model_id (fk vehicle_models, nullOnDelete),
  plate, color, year, current_mileage, fuel, chassis, timestamps
  -- current_mileage is a denormalized cache; the source of truth is asset_readings

asset_properties
  id, kind, unit, size, address, floor, condo, timestamps

asset_pets
  id, species, breed, size, birthdate, weight, vaccines, microchip, timestamps

asset_readings                          -- append-only odometer log (history intact)
  id, asset_id (fk, cascade),
  service_request_id (fk service_requests, nullOnDelete, nullable),
  mileage (unsigned int), recorded_at, note (nullable),
  recorded_by_id (fk users, nullable),
  source (enum: 'customer' | 'provider'), timestamps
```

All detail columns are nullable strings (year/mileage kept as strings to match
the existing free-form UI; tightening to typed/validated values is a follow-up).
The `assets.type` enum is kept (denormalized) because the list filter, icon, and
index already key on it and filtering by type then needs no join; it always
mirrors the morph alias.

### Models & morph map

- `Asset::detailable(): MorphTo`. Hard-deleting an asset cascades to its detail
  via a `deleting` model hook (archive is unaffected — it only sets `archived_at`).
- `AssetVehicle` / `AssetProperty` / `AssetPet` hold the columns; `AssetVehicle`
  `belongsTo` `VehicleMake` and `VehicleModel`.
- Register `Relation::morphMap(['vehicle' => AssetVehicle::class, 'property' =>
  AssetProperty::class, 'pet' => AssetPet::class])` in `AppServiceProvider`. This
  is **additive** — it does not call `enforceMorphMap`, so the existing
  full-class-name `Media` morphs keep working — and it makes `detailable_type`
  store the clean alias matching `AssetType`.

### Controller

`store`/`update` validate per type and write the detail row + asset together
(in a transaction). The payload is `{ type, nickname, detail: { …type fields… },
vehicle_make_id?, vehicle_model_id? }`.

```php
private const RULES = [
  'vehicle'  => ['plate' => 'nullable|string|max:16', 'color' => '...', 'year' => '...',
                 'mileage' => '...', 'fuel' => '...', 'chassis' => '...'],
  'property' => ['kind' => '...', 'unit' => '...', 'size' => '...', 'address' => '...',
                 'floor' => '...', 'condo' => '...'],
  'pet'      => ['species' => '...', 'breed' => '...', 'size' => '...', 'birthdate' => '...',
                 'weight' => '...', 'vaccines' => '...', 'microchip' => '...'],
];
```

For `vehicle`, additionally validate `vehicle_make_id`
(`nullable|exists:vehicle_makes,id`) and `vehicle_model_id`
(`nullable|exists:vehicle_models,id` + a rule that the model belongs to the make).
`update` mutates the existing `detailable` row (type is immutable once set).

### Resource

`AssetResource` loads `detailable` and serializes via a per-type detail resource
(`AssetVehicleResource` resolves `make`/`model` names from the relations and also
emits the raw `vehicle_make_id`/`vehicle_model_id` for the edit pickers):

```json
{ "id": 1, "type": "vehicle", "nickname": "Civic do pai",
  "photo_url": "…", "archived": false,
  "detail": { "make": "Honda", "model": "Civic",
              "vehicle_make_id": 12, "vehicle_model_id": 134,
              "plate": "ABC1D23", "color": "Prata", "year": "2019",
              "current_mileage": 48210, "fuel": null, "chassis": null } }
```

The list caption reads `detail.make · detail.model · detail.plate · …`. The
readings timeline is fetched separately (it can grow), not embedded in the asset
payload.

## Vehicle make/model catalog (seeded)

- **Tables**: `vehicle_makes (id, name unique, kind 'car'|'moto', timestamps)`,
  `vehicle_models (id, vehicle_make_id fk cascade, name, timestamps,
  unique(make,name))`.
- **Dataset**: JSON vendored under `backend/database/data/` — cars from
  `matthlavacka/car-list` / `getFrontend/json-car-list` **+ a motorcycle
  make/model list** (the vehicle type covers motos; the seed has a "Honda CG 160"
  and there is no free-text escape). Static copy, not a live FIPE call → seed is
  deterministic, offline, not rate-limited.
- **Seeder** `VehicleCatalogSeeder`: idempotent upsert on the unique keys; wired
  into `DatabaseSeeder` before `AssetSeeder`.
- **Endpoint** `GET vehicle-makes` → `[{ id, name, kind, models: [{ id, name }] }]`
  (`VehicleMakeResource` with `whenLoaded('models')`). ~1–2k rows, returned once
  and cached client-side (long `staleTime`); no per-make round-trips.

`AssetSeeder` is rewritten to create `AssetVehicle` rows with make/model ids
looked up from the catalog (Honda→Civic, VW→Gol, Honda→CG 160), then the assets.

## Asset photo

Single photo in `assets.photo_path` (not the polymorphic `media` table). Mirrors
the avatar/document pattern:

```php
// AssetController@photo
$this->authorizeOwner($request, $asset);
$request->validate(['photo' => ['required', 'image', 'max:5120']]);
$old = $asset->photo_path;
$asset->update(['photo_path' => $request->file('photo')->store('assets', 'public')]);
if ($old) { Storage::disk('public')->delete($old); }
return new AssetResource($asset->load('detailable'));
```

Route `POST assets/{asset}/photo`. A dedicated endpoint keeps the catalog/detail
writes as clean JSON instead of forcing multipart with nested objects (matches
`POST requests/{id}/photos`). Client reuses `photos.ts` (`pickPhotos`,
`appendPhoto`); add-flow uploads after create; list/detail render `photo_url`
with the type-icon fallback. `useUploadAssetPhoto(id)` invalidates `['asset', id]`
+ `['assets']`.

## Vehicle mileage: current value + reading log

Mileage must not be an overwritten field — recording a new value at an oil change
has to leave the prior readings intact. So:

- **`asset_readings`** is append-only. Each row is one odometer reading at a point
  in time, optionally tied to a service request (`service_request_id`). Nothing
  ever updates or deletes a reading through the normal flow.
- **`asset_vehicles.current_mileage`** is a denormalized cache of the latest
  reading, kept for cheap display and for the "km atual" shown on the asset.

**Recording a reading** is a shared action (`AssetReadingService::record`) used by
both capture points, run in a transaction:
1. Insert the `asset_readings` row (`mileage`, `recorded_at`, optional
   `service_request_id` + `note`, `recorded_by_id = auth id`, `source`).
2. `current_mileage = max(current_mileage ?? 0, mileage)` — odometers only go up,
   so a lower reading is stored in the log (for correction history) but does not
   lower the displayed current. (A reading far above current can warn client-side;
   not blocked.)

**Two capture points, same action, both persisted:**

- **Customer** — `POST assets/{asset}/readings` (owner-authorized):
  `{ mileage: int>0, recorded_at?: date, service_request_id?: int, note?: string }`,
  `source = customer`. If `service_request_id` is given it must belong to this
  asset (else 422).
- **Provider** — `POST requests/{serviceRequest}/odometer` in the provider job
  group (authorized to the accepted provider, the same guard `JobController` uses):
  `{ mileage: int>0, note? }`. The reading is tied to that request and its vehicle
  asset (`asset_id` from `serviceRequest->asset_id`, `service_request_id` = the
  request), `source = provider`. 422 if the request has no vehicle asset.

Both return the created reading + the asset's new `current_mileage`.

**Initial value**: creating a vehicle asset with an initial mileage just records
the first reading (no special-case column write). The **edit** screen has *no*
free mileage field — that would silently overwrite; mileage is changed only by
recording a reading.

**Clients**:
- *Customer app*: `assetsApi.addReading(id, payload)` + `useAddReading(id)`
  invalidating `['asset', id]`, `['asset-readings', id]`, `['assets']`. The detail
  screen shows `current_mileage` with a "Registrar km" affordance and the readings
  timeline (`useAssetReadings(id)`, infinite); each entry shows date · km · source
  (oficina/você) · the linked service if any.
- *Provider app*: an odometer affordance in the job report flow
  (`requests/{id}/updates` + `/parts` screen). `providerApi.recordOdometer(reqId,
  payload)` + a mutation invalidating the job query. Only shown when the job's
  request has a vehicle asset.

## Detail view + history

### Routing
`expo-router` can't have both `[id].tsx` and `[id]/edit.tsx`, so:
```
app/assets/[id]/index.tsx   # NEW — detail (photo, characteristics read-only, history)
app/assets/[id]/edit.tsx    # the form (rename/detail/photo/archive)
```
List card + profile menu already `push('/assets/[id]')` → now the detail view;
"Edit" pushes `/assets/[id]/edit`.

### History
`Asset::serviceRequests(): HasMany` (inverse of `ServiceRequest::asset()`).
`AssetController@history` (owner-authorized) returns paginated
`ServiceRequestResource::collection($asset->serviceRequests()->with('category')
->latest()->paginate($this->perPage($request)))`. Route `GET assets/{asset}/history`.
`useAssetHistory(id)` is a `useInfiniteQuery`; the detail screen renders it inline
and paginates via the parent `Screen onEndReached` (no nested VirtualizedList),
with an `EmptyState` when empty.

## Assets list filter

`GET assets` already accepts `?type=`. The list screen (a `PaginatedList`) gains a
chip row in its `ListHeaderComponent`: All / Vehicle / Property / Pet. The chip
sets the `useAssets(type)` query key, so filtering is **server-side**; "All"
passes no `type`.

## Client contract change

The shared `Asset` type changes from `{ attributes: Record<string,string> }` to
`{ detail: {...typed fields...} }` (vehicle detail adds `vehicle_make_id` /
`vehicle_model_id` + resolved `make`/`model`). `assetFields.ts` still drives which
fields render per type (writing into `detail`); make/model render via the
`MakeModelPicker` (writes ids, no free text). **Mileage is not in
`assetFields`** — it is shown read-only as `current_mileage` and changed only via
the readings flow (so editing never overwrites history). The request-creation
wizard's asset picker (`request/new.tsx`) is updated to read `detail` instead of
`attributes`.

## Risks / edge cases

- **Bigger change than a JSON tweak.** Normalized tables + morph add migrations,
  per-type validation, and detail resources vs. the one JSON column. Accepted: the
  user wants the correct, typed, queryable model; this also unlocks future
  per-field validation and reporting. Noted as the deliberate trade.
- **Catalog completeness (no free-text escape).** make/model are id-only, so a
  vehicle the catalog lacks can't be fully represented; mitigated by seeding cars
  **and** motos and keeping both ids nullable (save make only, or neither). A
  missing make is a seed-data gap, not a code change.
- **Old `attributes` JSON.** No backfill — dev resets via `migrate:fresh --seed`
  with the rewritten `AssetSeeder`. (If this ever shipped to data that mattered, a
  one-off backfill command would be a separate change.)
- **morphMap is additive.** Using `Relation::morphMap` (not `enforceMorphMap`)
  leaves existing `Media` morphs (full class names) working.
- **Photo orphan on replace.** Old file deleted only after the new path saves.
- **History authorization.** `authorizeOwner` guards it; non-owner → 403.
- **Mileage history is append-only.** Readings are never updated/deleted in the
  normal flow; `current_mileage` is derived (max). Editing the asset can't touch
  the log, so an oil-change reading is preserved.
- **Two writers, one log.** Customer and provider readings share the same table
  and action, distinguished by `source` + `recorded_by_id`. The provider endpoint
  is guarded to the accepted provider of the request and can only write to that
  request's own asset, so a provider can't touch arbitrary assets. Both readings
  are shown in the owner's timeline.
