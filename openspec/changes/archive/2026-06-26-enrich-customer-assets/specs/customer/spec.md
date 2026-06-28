# customer

## ADDED Requirements

### Requirement: Asset characteristics are stored in typed per-type structures
An asset's type-specific characteristics SHALL be stored in a typed structure per
type (vehicle, property, pet) rather than a single free-form blob, with the asset
referencing its detail polymorphically. The detail SHALL be created and updated
together with the asset, and removed when the asset is hard-deleted (archiving
keeps it).

#### Scenario: Detail created with the asset
- WHEN the customer creates an asset of a given type
- THEN a detail record of that type is created with the submitted fields and linked to the asset

#### Scenario: Detail returned with the asset
- WHEN the asset is read
- THEN its type-specific characteristics are returned under the asset's detail

#### Scenario: Type is fixed after creation
- WHEN an existing asset is edited
- THEN its type cannot change, and edits update the same detail record

### Requirement: Asset catalog captures richer per-type details
The asset add and edit screens SHALL present an extended set of fields per type —
vehicle (make, model, plate, color, year, mileage, fuel, chassis), property (kind,
unit, size, address, floor, condo), and pet (species, breed, size, birthdate,
weight, vaccines, microchip) — with make and model as distinct fields.

#### Scenario: Vehicle exposes make and model separately
- WHEN the customer adds or edits a vehicle asset
- THEN distinct "Make" and "Model" pickers are shown, and the selected make appears in the asset's list caption

#### Scenario: New fields persist
- WHEN the customer saves an asset with the extended fields filled
- THEN those values are stored in `attributes` and shown again when the asset is reopened

#### Scenario: Empty fields are allowed
- WHEN the customer leaves an extended field blank
- THEN the asset saves with that field empty (null), not requiring it

### Requirement: Vehicle make and model are chosen from a seeded catalog by id
The system SHALL maintain a seeded catalog of vehicle makes and their models
(covering cars and motorcycles), exposed via `GET vehicle-makes`. The vehicle
asset form SHALL let the customer pick a make and then a model from that catalog,
with the model list scoped to the chosen make. The chosen make and model SHALL be
stored on the asset as foreign-key references (`vehicle_make_id`,
`vehicle_model_id`), not as free text, and the asset's displayed make/model SHALL
resolve from those references. A model SHALL belong to the selected make.

#### Scenario: Catalog drives the pickers
- WHEN the customer opens the make picker on a vehicle asset
- THEN seeded makes are listed, and after choosing one the model picker lists only that make's models

#### Scenario: Selection stored and resolved by id
- WHEN the customer picks a make and model and saves
- THEN the asset stores `vehicle_make_id`/`vehicle_model_id` and its make/model names are resolved from the catalog for display

#### Scenario: Model must belong to the make
- WHEN a create/update sends a `vehicle_model_id` that does not belong to the given `vehicle_make_id`
- THEN the request is rejected as invalid

#### Scenario: Catalog is seeded
- WHEN the database is seeded
- THEN `vehicle_makes` and `vehicle_models` are populated (cars and motorcycles) and `GET vehicle-makes` returns makes with their models

### Requirement: Asset carries a photo
A customer asset SHALL support a single photo, uploadable when adding or editing
the asset and shown on the asset list and detail screens, with a type icon shown
as a fallback when no photo exists.

#### Scenario: Add an asset with a photo
- WHEN the customer picks a photo while adding an asset and saves
- THEN the photo is uploaded to the created asset and appears on its list row and detail screen

#### Scenario: Replace an existing photo
- WHEN the customer changes the photo of an existing asset
- THEN the new photo replaces the previous one and the old file is removed

#### Scenario: Fallback when no photo
- WHEN an asset has no photo
- THEN its type icon (vehicle/property/pet) is shown in its place

### Requirement: Asset detail view shows service history
The `/assets/{id}` route SHALL be a detail view showing the asset's photo,
read-only attributes, and the paginated history of service requests tied to the
asset (newest first), with editing moved to a separate edit screen. A non-owner
SHALL NOT be able to read an asset's history.

#### Scenario: Detail lists the asset's services
- WHEN the customer opens an asset that has linked service requests
- THEN the detail screen shows those requests newest-first with their status and category

#### Scenario: History paginates
- WHEN the customer scrolls the detail screen near the bottom and more history exists
- THEN the next page of service requests is appended

#### Scenario: Empty history
- WHEN the customer opens an asset with no linked requests
- THEN an empty-state is shown instead of the history list

#### Scenario: Edit is a separate screen
- WHEN the customer taps Edit on the detail view
- THEN the edit screen opens for renaming, correcting attributes, changing the photo, and archiving

#### Scenario: History is owner-only
- WHEN a user who does not own the asset requests its history
- THEN the request is rejected with 403

### Requirement: Vehicle mileage is a current value backed by an append-only history
A vehicle asset SHALL have a current mileage and an append-only history of odometer
readings, recorded by either the customer (from their car) or the provider
servicing it. Recording a reading SHALL add to the history (tagged with its source
and any linked service request) and update the current mileage without altering
prior readings. Editing the asset's other fields SHALL NOT change mileage.

#### Scenario: Customer records a reading
- WHEN the customer records a new odometer reading for a vehicle
- THEN a reading tagged as customer-recorded is appended and the current mileage reflects the new value, with earlier readings preserved

#### Scenario: Provider-recorded readings appear in the owner's history
- WHEN the provider records the odometer during a service on the asset
- THEN that reading appears in the customer's asset history tagged as provider-recorded, linked to the service, and updates the current mileage

#### Scenario: Reading can reference a service
- WHEN the customer records a reading and links it to one of the asset's service requests
- THEN the reading is associated with that service in the history

#### Scenario: Reading must reference the asset's own service
- WHEN a customer reading references a service request that does not belong to the asset
- THEN the request is rejected as invalid

#### Scenario: Editing the asset does not touch mileage
- WHEN the customer edits other fields of the asset
- THEN the mileage history and current mileage are unchanged

#### Scenario: Current mileage does not decrease
- WHEN a recorded reading is lower than the current mileage
- THEN it is still kept in the history but the current mileage is not lowered

### Requirement: Assets list can be filtered by type
The Meus ativos list SHALL offer a type filter (All, Vehicle, Property, Pet)
presented in the list header, applied server-side via the `GET assets` `type`
parameter.

#### Scenario: Filter to one type
- WHEN the customer selects the "Vehicle" filter
- THEN only vehicle assets are listed (fetched with `?type=vehicle`)

#### Scenario: Clear the filter
- WHEN the customer selects "All"
- THEN assets of every type are listed again
