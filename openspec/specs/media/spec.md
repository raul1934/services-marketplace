# media

## Requirements

### Requirement: Images are stored in one polymorphic media table
User-generated images SHALL be stored as rows in a polymorphic `media` table
(`mediable_type`/`mediable_id`, `tag`, `path`, `uploaded_by_id`, `position`) rather
than per-feature tables, JSON arrays, or string columns. Request photos, provider
before/after photos, surcharge photos, and dispute evidence SHALL all be media rows
distinguished by `tag`. (Avatar and asset cover photos remain 1:1 columns.)

#### Scenario: A request's photos are media rows
- WHEN a request has reference and before/after photos
- THEN they are `media` rows with `mediable` = the request and tags `request`/`before`/`after`
- AND the request resource still exposes `photos`, `before_photos`, `after_photos` as `{ id, url }`

### Requirement: Files can be uploaded before the owning record exists
A client SHALL be able to upload an image to a generic endpoint and receive an id +
url immediately, then attach it to a record on create/update by passing its id.

#### Scenario: Upload then attach on create
- WHEN the client POSTs file(s) to `/uploads`
- THEN a `media` row is created with no `mediable` (orphan) and `{ id, url }` is returned
- WHEN the client later creates a request with that id in `media_ids[]`
- THEN the media is re-parented to the request with the `request` tag

#### Scenario: Cannot attach another user's upload
- WHEN a client passes a `media_ids[]` value uploaded by a different user
- THEN that id is ignored (not attached) and remains an orphan

### Requirement: Orphaned uploads are pruned
Media that are never attached SHALL be removed automatically.

#### Scenario: Prune old orphans
- WHEN `media:prune-orphans` runs and an orphan media is older than 24h
- THEN the media row and its file are deleted
- AND attached media (any age) and fresh orphans are kept

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
- WHEN the client needs to attach an image to an asset, request, answer, job or avatar
- THEN it uploads via `POST uploads` and passes the id(s) to that target's own create/update/action (there is no per-target image-upload endpoint)
