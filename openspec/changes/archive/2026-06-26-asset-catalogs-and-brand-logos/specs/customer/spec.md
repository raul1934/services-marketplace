# customer

## ADDED Requirements

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
