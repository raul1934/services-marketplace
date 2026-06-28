# provider

## ADDED Requirements

### Requirement: Provider image attachments are upload-first
Provider image attachments (job before/after photos, profile avatar) SHALL be
uploaded via `POST uploads` and attached by media id on the owning
create/update/action; there SHALL be no per-target provider image-upload
endpoints. (Provider documents are out of scope — they accept non-image files
such as PDFs and keep their own endpoint.)

#### Scenario: Before/after job photos
- WHEN the provider adds before/after photos in the job report
- THEN the photos are uploaded first and attached by `media_ids` with the `phase` (before/after)

#### Scenario: Avatar
- WHEN the provider sets a profile photo
- THEN it is uploaded first and the profile is updated with the returned `avatar_media_id`
