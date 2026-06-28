# Design — unify image uploads

## The single endpoint

`POST uploads` (already exists, `UploadController@store`, mounted in both
customer and provider groups) is the one upload endpoint. Change:
- Accept **`photos[]`** as the canonical field (1–10 images), keep `files[]` /
  `file` as aliases (normalize to one list) so nothing breaks mid-migration.
- Validate `image|max:5120`; return `MediaResource::collection` → `[{ id, url }]`.

Orphan media (no `mediable`) are created by `MediaService::store`. They're claimed
later by `MediaService::attach(ids, owner, tag, uploaderId)`, which only
re-parents media that are still unattached AND uploaded by that user — so a client
can't attach someone else's upload.

## Upload-first per consumer

The client flow is always: `pick → uploadPhotos() → ids → create/update/action`.

- **Reference photos (request)** — already upload-first: `create-request` takes
  `media_ids` → `attach(..., 'request')`. Keep. Remove `requests/{id}/photos`;
  post-create additions (if any) go through request update with `media_ids`.
- **Asset photo** — asset `store`/`update` accept `photo_media_id`
  (`nullable|integer|exists:media,id`, owned by the user). The controller resolves
  the media's `path`, sets `asset.photo_path`, deletes the previous file, and
  consumes the media row (it becomes the asset's photo; no `mediable` needed since
  it's a single column). Remove `assets/{id}/photo`.
- **Answer photos (question)** — the answer call accepts `media_ids` →
  `attach(..., 'answer')` on the question. Remove `questions/{id}/photos`.
- **Job before/after (provider)** — a job-report action
  (`POST requests/{id}/job-media` or folded into the existing report update)
  accepts `media_ids` + `phase` (`before|after`) → `attach(..., phase)`. Remove
  `requests/{id}/job-photos`. *(This is the one new attach route; it's not an
  upload — upload still goes through `POST uploads`.)*
- **Avatar** — `PUT provider/profile` accepts `avatar_media_id` → sets the user's
  avatar path from the media. Remove `provider/profile/avatar`.
- **Document** — `POST provider/documents` accepts `media_id` (+ doc metadata) and
  references the media's stored path. Remove its multipart `file` handling.

## Tags

`MediaService::attach` writes a `tag`; the polymorphic relations filter by it
(`photos`→`request`, `beforePhotos`→`before`, `afterPhotos`→`after`,
answer→`answer`). The consumer passes the tag, so the single upload endpoint stays
target-agnostic.

## Client

`packages/shared` exposes one helper:
```ts
uploadPhotos(picked: PickedPhoto[]): Promise<{ id: number; url: string }[]>
```
(posts `photos[]` to `uploads`). `appendPhoto` (web Blob vs native shape) stays.
Each app drops `photosForm`/`mediaForm`/`assetPhotoForm`/`jobPhotosForm`; screens
call `uploadPhotos` then pass ids:
- asset new/edit → `photo_media_id` on create/update.
- request wizard → `media_ids` (already).
- worklog → upload then job-media action with `phase`.
- profile avatar → `avatar_media_id`; documents → `media_id`; answer → `media_ids`.

## Risks / edge cases

- **Big surface, single change.** All callers migrate together so no endpoint is
  left orphaned; removal + migration land atomically.
- **Single-column targets** (asset photo, avatar): the uploaded media becomes the
  source of the stored path; the old file is deleted on replace. The media row may
  be left unattached (harmless) or deleted after copy — we set `photo_path` to the
  media path and delete the prior file.
- **Authorization**: `attach` is uploader-scoped; `*_media_id` validated with
  `exists:media,id` + owner check, so a user can't point at another's media.
- **Tests**: `MediaFlowTest` and any photo-flow tests are rewritten to the
  upload-first shape. New tests cover: upload `photos[]` → ids; asset
  `photo_media_id`; job `phase` attach; non-owner media id rejected.
- **Validation parity**: per-image `image|max:5120` stays; the array cap (10)
  applies on `uploads`.
