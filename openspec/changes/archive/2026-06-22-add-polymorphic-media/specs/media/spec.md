# media

## ADDED Requirements

### Requirement: Images are stored in one polymorphic media table
User-generated images SHALL be stored as rows in a polymorphic `media` table
(`mediable_type`/`mediable_id`, `tag`, `path`, `uploaded_by_id`, `position`) rather
than per-feature tables, JSON arrays, or string columns. Request photos, provider
before/after photos, surcharge photos, and dispute evidence SHALL all be media rows
distinguished by `tag`.

#### Scenario: A request's photos are media rows
- WHEN a request has reference and before/after photos
- THEN they are `media` rows with `mediable` = the request and tags `request`/`before`/`after`
- AND the request resource still exposes `photos`, `before_photos`, `after_photos` as `{ id, url }`

### Requirement: Files can be uploaded before the owning record exists
A client SHALL be able to upload an image to a generic endpoint and receive an id +
url immediately, then attach it to a record on create/update by passing its id.

#### Scenario: Upload then attach on create
- WHEN the client POSTs a file to `/uploads`
- THEN a `media` row is created with no `mediable` (orphan) and `{ id, url }` is returned
- WHEN the client later creates a request with that id in `media_ids[]`
- THEN the media is re-parented to the request with the appropriate tag

#### Scenario: Cannot attach another user's upload
- WHEN a client passes a `media_ids[]` value uploaded by a different user
- THEN that id is ignored (not attached)

### Requirement: Orphaned uploads are pruned
Media that are never attached SHALL be removed automatically.

#### Scenario: Prune old orphans
- WHEN the prune command runs and an orphan media is older than 24h
- THEN the media row and its file are deleted
- AND attached media (any age) are never pruned
