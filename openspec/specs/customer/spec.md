# customer

## Requirements

### Requirement: Customer sees a payment receipt after the job completes
After a request reaches `completed`, the customer SHALL be able to view a receipt
showing the amount breakdown (labor, parts, approved surcharges), the total, the
payment method, the settled date, and a receipt number. The figures SHALL equal
what settled on the backend (`settleEarnings`). The platform commission is not
shown to the customer.

#### Scenario: View receipt for a completed request
- WHEN the customer opens a completed request and taps "Ver recibo"
- THEN the receipt screen (`V3PagamentoOk`) shows labor, each part line, surcharges, the total, the payment method, the settled date, and the receipt number
- AND the total equals labor + parts + approved surcharges

#### Scenario: Receipt unavailable before completion
- WHEN the request has not been completed
- THEN no receipt entry point is shown

### Requirement: Customer can read out the start-of-service code
A start code SHALL exist only for **urgent** jobs. While a provider is assigned and
an urgent request is `accepted` (en route, not yet started), the customer SHALL see
the start code to read to the provider on arrival. Scheduled requests have no start
code and SHALL NOT show the card.

#### Scenario: Start code visible while en route (urgent)
- WHEN an urgent request's status is `accepted`
- THEN the request screen shows a "Código de início" with the request's `start_code` and instructions to give it to the provider
- AND the code is no longer emphasized once the job is `in_progress`

#### Scenario: No start code for scheduled jobs
- WHEN a scheduled request is `accepted`
- THEN no start-code card is shown (no code was generated)

### Requirement: Customer chooses a proposal inline on the open request screen
While a request is open, the proposal list (with sorting by price / ETA /
rating), proposal acceptance, and the cancel-request action SHALL render inline
on the request screen (`request/[id]`) — not on a separate route. Accepting a
proposal SHALL move the same screen into its accepted state. The
`request/[id]/proposals` route SHALL redirect to `request/[id]` so existing
links and notifications keep working.

#### Scenario: Compare and accept inline
- WHEN the customer opens an open request
- THEN the proposals (sortable) are listed inline on the request screen, with no separate "Ver propostas" navigation
- AND accepting one moves the screen into the accepted state

#### Scenario: Legacy proposals URL redirects
- WHEN the customer opens `request/[id]/proposals`
- THEN they are redirected to `request/[id]`

#### Scenario: Cancel while open
- WHEN the customer chooses to cancel from the open request screen
- THEN the request is cancelled after confirmation

### Requirement: Customer attaches photos during the create-request wizard
The create-request wizard SHALL upload selected photos and attach the resulting
media ids when the request is created, so photos can be picked before the request
exists.

#### Scenario: Photos picked in the wizard are attached on submit
- WHEN the customer selects photos in the wizard and submits
- THEN the photos are uploaded and the request is created with those media attached as `request`-tagged photos

### Requirement: Create-request is a multi-step wizard ending in a read-only review
Creating a request SHALL be a stepped wizard (details → photos → location & access →
schedule → budget & payment → review) whose **final step is a read-only synthesis**
of the whole request, shown before submission. Payment method SHALL be chosen on its
own step (not buried in the final step) and SHALL appear in the review. No data entry
happens on the review step — only confirmation.

#### Scenario: Payment is a deliberate step
- WHEN the customer reaches the budget & payment step
- THEN they pick a payment method (Pix / Card / Cash) alongside the budget
- AND the chosen method is carried into the request on submit

#### Scenario: Final step synthesizes the request
- WHEN the customer reaches the last step
- THEN it shows a read-only summary including service, vehicle (if any), description, answered questions, photo count, location/access, schedule, budget, and payment method
- AND confirming (slide-to-confirm) creates the request and navigates to its detail

#### Scenario: Jump back to edit from the review
- WHEN the customer taps a row in the review
- THEN the wizard returns to the step that owns that field for editing

#### Scenario: Step validation
- WHEN a required step is incomplete (no description/asset, no location, or no schedule when scheduled)
- THEN Continue is disabled until it is satisfied
- AND optional steps (photos, budget/payment) can be advanced with their defaults

### Requirement: The request screen unifies detail and live tracking
The customer SHALL have a single screen per request (`request/[id]`) that serves
every state (open, accepting proposals, accepted/en route, in progress,
completed, and terminal states). When a provider is assigned and a live location
is available, the live map, distance/ETA, and the progress strip SHALL render
inline on that screen. The separate `request/[id]/track` route SHALL redirect to
`request/[id]` so existing links keep working.

#### Scenario: Live map shows inline while en route
- WHEN the request is `accepted` or `in_progress` and a provider location is available
- THEN the request screen shows the map, the distance/ETA, and the progress strip inline, with no separate "track" navigation

#### Scenario: Legacy track URL redirects
- WHEN the customer opens `request/[id]/track`
- THEN they are redirected to `request/[id]`

#### Scenario: One screen across states
- WHEN the request moves from open to completed
- THEN the same `request/[id]` screen represents each state without navigating to a different request screen

### Requirement: Customer sees a chronological event feed for a request
The request screen SHALL show a feed of the request's events plus the approved
value. The feed SHALL be sourced from `GET requests/{id}/events`, which returns a
typed chronological list derived from the request's existing data (creation,
proposals, acceptance, start, parts, surcharges, reschedules, provider updates,
completion, requote, cancellation, no-show, expiry, review). Collapsed, the feed
SHALL show the 5 most recent events with the latest at the bottom; tapping SHALL
expand it to the full list. The events endpoint SHALL be restricted to the
request's owner.

#### Scenario: Collapsed feed shows the latest five
- WHEN a request has more than five events
- THEN the feed shows the five most recent events with the latest at the bottom, plus an affordance to view all

#### Scenario: Expand to full history
- WHEN the customer taps the feed
- THEN the full chronological list of events is shown

#### Scenario: Approved value is shown
- WHEN a proposal has been accepted
- THEN the feed shows the approved value (the accepted proposal's price)

#### Scenario: Events are owner-scoped
- WHEN a user who does not own the request requests its events
- THEN the request is rejected with 403

#### Scenario: Open request shows only what has happened
- WHEN a request is still open with two proposals received
- THEN the feed contains the creation event and the two proposal-received events, and no start/completion events

### Requirement: Required actions surface inline on the request screen
The actions the customer must take SHALL appear as inline cards/banners on the
request screen as they become relevant (approve parts, respond to a surcharge,
accept/decline a reschedule, accept a requote, submit a review, open
warranty/dispute). Dense sub-flows (proposal list, surcharge response, requote,
reschedule, dispute, warranty) SHALL remain their own routes, opened from those
inline cards.

#### Scenario: Pending parts approval shows inline
- WHEN the provider has requested parts approval and it is not yet approved
- THEN an "approve parts" card is shown inline on the request screen

#### Scenario: Sub-flow opens from the inline card
- WHEN the customer taps a pending surcharge card
- THEN the surcharge response screen opens as its own route

### Requirement: Home active-request card reflects the request state
The home screen SHALL surface the customer's relevant (non-terminal) requests as
a prioritized list of at most two cards. The order SHALL be: open & urgent, then
open (em cotação), then re-quote, then open & scheduled (by next scheduled date),
then accepted / in progress. When there are no open requests, the upcoming
scheduled requests SHALL therefore surface. When more requests match than are
shown, a "see all" action SHALL navigate to the Requests tab.

Each card SHALL present state-appropriate information: while open it shows the
proposals count and a "review proposals" action; once accepted / in progress it
shows a status badge and a "track service" action. Tapping a card SHALL open that
request's screen.

#### Scenario: Open requests are listed first, capped at two
- WHEN the customer has more than two non-terminal requests
- THEN the home shows the two highest-priority ones (open & urgent first, then open, then re-quote, then scheduled)
- AND a "Ver todos (N)" action is shown

#### Scenario: See all navigates to the Requests tab
- WHEN the customer taps "Ver todos"
- THEN the Requests tab opens with the full list

#### Scenario: Upcoming scheduled requests when nothing is open
- WHEN the customer has no open requests but has scheduled ones
- THEN the home shows the upcoming scheduled requests (soonest first)

#### Scenario: Accepted request shows status and tracking
- WHEN a listed card represents an accepted or in-progress request
- THEN it shows a status badge instead of the proposals count
- AND its action is "Acompanhar atendimento", opening the request screen

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
- THEN those values are stored on its detail and shown again when the asset is reopened

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
A customer asset SHALL support a single photo, set by uploading it via the shared
upload endpoint and passing the resulting media id (`photo_media_id`) when
creating or editing the asset; it is shown on the asset list and detail screens,
with a type icon shown as a fallback when no photo exists.

#### Scenario: Add an asset with a photo
- WHEN the customer picks a photo while adding an asset, it is uploaded, and the asset is created with the returned `photo_media_id`
- THEN the photo is stored on the asset and appears on its list row and detail screen

#### Scenario: Replace an existing photo
- WHEN the customer changes the photo of an existing asset (new `photo_media_id`)
- THEN the new photo replaces the previous one and the old file is removed

#### Scenario: Fallback when no photo
- WHEN an asset has no photo
- THEN its type icon (vehicle/property/pet) is shown in its place

### Requirement: Customer image attachments are upload-first
Customer image attachments (request reference photos, answer photos, asset photo)
SHALL be uploaded via `POST uploads` and attached by media id on the owning
create/update/action; there SHALL be no per-target customer image-upload endpoints.

#### Scenario: Request reference photos
- WHEN the customer attaches photos while creating a request
- THEN they are uploaded first and attached via `media_ids` on the request

#### Scenario: Answer photos
- WHEN the customer attaches a photo to a question answer
- THEN it is uploaded first and attached via `media_ids` on the answer

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

### Requirement: Property type is chosen from a seeded catalog by id
The system SHALL maintain a seeded catalog of property types, exposed via
`GET property-types`. The property asset form SHALL let the customer pick the
property type from that catalog, storing it as a foreign-key reference
(`property_type_id`) rather than free text, with the displayed type resolved from
the reference.

#### Scenario: Property type picked from the catalog
- WHEN the customer adds or edits a property asset
- THEN the type is chosen from the seeded list and stored as `property_type_id`, and its name is resolved for display

#### Scenario: Catalog is seeded
- WHEN the database is seeded
- THEN `property_types` is populated and `GET property-types` returns the list

### Requirement: Pet species and breed are chosen from seeded catalogs by id
The system SHALL maintain seeded catalogs of pet species and breeds (breed scoped
to species), exposed via `GET pet-species` (breeds nested). The pet asset form
SHALL let the customer pick a species and then a breed scoped to that species,
stored as foreign-key references (`pet_species_id`, `pet_breed_id`) rather than
free text, with names resolved for display. A breed SHALL belong to the selected
species; breed is optional.

#### Scenario: Species drives the breed list
- WHEN the customer opens the breed picker after choosing a species
- THEN only breeds of that species are listed

#### Scenario: Breed must belong to the species
- WHEN a create/update sends a `pet_breed_id` that does not belong to the given `pet_species_id`
- THEN the request is rejected as invalid

#### Scenario: Species without a listed breed
- WHEN the customer picks a species that has no catalog breeds (or leaves breed blank)
- THEN the asset saves with the species set and no breed

#### Scenario: Catalog is seeded
- WHEN the database is seeded
- THEN `pet_species` and `pet_breeds` are populated and `GET pet-species` returns species with their breeds

### Requirement: Vehicle makes carry a brand logo
Each seeded vehicle make SHALL optionally carry a brand logo, returned as
`logo_url` from `GET vehicle-makes` and shown in the make picker (and the vehicle
asset header). A make without a logo SHALL fall back to the generic vehicle icon.

#### Scenario: Make logo shown in the picker
- WHEN the customer opens the make picker and a make has a logo
- THEN the make's logo is shown next to its name

#### Scenario: Fallback when a make has no logo
- WHEN a make has no logo (e.g. a brand absent from the logo set)
- THEN the generic vehicle icon is shown in its place

### Requirement: The request screen shows its linked asset
The request screen SHALL show the asset the request is tied to — its nickname and
type, the brand logo and make·model·plate caption for vehicles — and tapping it
SHALL open that asset's detail.

#### Scenario: Vehicle request shows the asset with its logo
- WHEN the customer opens a request tied to a vehicle asset
- THEN the screen shows the asset's brand logo and make·model·plate, linking to the asset detail

#### Scenario: Request with no asset
- WHEN a request has no linked asset
- THEN no asset card is shown

### Requirement: Completed requests show a consolidated summary
When a request is completed, the request screen SHALL consolidate what happened:
the settlement/receipt breakdown, the parts used, the key timestamps, the
provider, and the customer's review.

#### Scenario: Completed request summary
- WHEN the customer opens a completed request
- THEN it shows the receipt/settlement, parts, accepted/started/completed times, the provider, and the review (if any)

#### Scenario: Non-completed request
- WHEN the request is not yet completed
- THEN the consolidated completed-summary section is not shown
