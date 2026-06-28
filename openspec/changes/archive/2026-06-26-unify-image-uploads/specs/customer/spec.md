# customer

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Customer image attachments are upload-first
Customer image attachments (request reference photos, answer photos, asset photo)
SHALL be uploaded via `POST uploads` and attached by media id on the owning
create/update/action; there SHALL be no per-target customer upload endpoints.

#### Scenario: Request reference photos
- WHEN the customer attaches photos while creating a request
- THEN they are uploaded first and attached via `media_ids` on the request

#### Scenario: Answer photos
- WHEN the customer attaches a photo to a question answer
- THEN it is uploaded first and attached via `media_ids` on the answer
