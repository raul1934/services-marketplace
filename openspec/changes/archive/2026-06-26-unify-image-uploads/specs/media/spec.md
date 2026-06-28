# media

## ADDED Requirements

### Requirement: A single upload-first endpoint for all images
All image uploads SHALL go through one endpoint (`POST uploads`) that accepts one
or more images under `photos[]` (with `files[]`/`file` accepted as aliases),
stores them as unattached media, and returns `[{ id, url }]`. Owning records claim
those media by id when they are created or updated; a user SHALL only be able to
attach media they uploaded.

#### Scenario: Upload one or many photos
- WHEN the client posts one or more images to `POST uploads` as `photos[]`
- THEN each is stored and the response is a list of `{ id, url }`

#### Scenario: Attach by id on the owning record
- WHEN the client passes uploaded media ids to a create/update/action
- THEN those media are attached to that record (with the record's tag) and are no longer orphan

#### Scenario: Cannot attach someone else's upload
- WHEN a client passes a media id it did not upload
- THEN that media is not attached to the record

#### Scenario: Per-target upload endpoints are removed
- WHEN the client needs to attach an image to an asset, request, answer, job, avatar or document
- THEN it uploads via `POST uploads` and passes the id(s) to that target's own create/update/action (there is no per-target upload endpoint)
