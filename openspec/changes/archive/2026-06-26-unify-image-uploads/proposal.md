# Unify image uploads into one upload-first endpoint

## Why

There are **7** image-upload endpoints across the two apps, with **4 different
field names** (`file`, `files[]`, `photos[]`, `photo`, `avatar`) and two shapes
(polymorphic `media` collections vs single-column targets). This inconsistency is
error-prone — it's exactly what caused the asset-photo `422` (the client sent
`photos[]` to an endpoint expecting `photo`).

The app already has the right primitive: `POST uploads` stores image(s) as orphan
`media` and returns `[{ id, url }]`, and `create-request` attaches them via
`media_ids[]` (`MediaService::attach` re-parents the orphans with a tag). We
generalize that **upload-first** model to everything.

## What changes

**1. One upload endpoint.** `POST uploads` (customer + provider, same
`UploadController`) becomes the single image endpoint: it accepts **`photos[]`**
(one or many images; `files[]`/`file` kept as accepted aliases for safety),
validates `image|max:5120`, and returns `[{ id, url }]`. One client helper —
`uploadPhotos(picked[]) → { id, url }[]` — replaces `photosForm` / `mediaForm` /
`assetPhotoForm` / `jobPhotosForm`.

**2. Attach by id everywhere; remove the 6 dedicated upload endpoints.** Each
consumer stops doing its own multipart upload and instead receives `media_ids`
(and a tag/phase where relevant) on its existing create/update/action:

| Removed endpoint | New path (upload-first) |
|---|---|
| `POST assets/{id}/photo` | asset create/update accept `photo_media_id` → sets `photo_path` from the media (replaces & deletes the old file) |
| `POST requests/{id}/photos` | reference photos attach via `media_ids` on create (already) / request update |
| `POST questions/{id}/photos` | answer attaches via `media_ids` on the answer call |
| `POST requests/{id}/job-photos` | a job-report action takes `media_ids` + `phase` (before/after) |
| `POST provider/profile/avatar` | `provider/profile` update takes `avatar_media_id` |
| `POST provider/documents` (file) | document store takes `media_id` |

`MediaService::attach` (re-parent orphan media by id, scoped to the uploader) is
the single attach mechanism; the per-target tag (`request`, `before`, `after`,
`answer`) is passed by the consumer. Single-column targets (asset photo, avatar)
and the document table read the uploaded media's stored path.

## Impact

- **Affected specs**: `customer`, `provider`, `media`
- **Affected code**:
  - Backend — `UploadController` (field `photos[]`); remove `AssetController@photo`,
    `RequestController@photos`, `QuestionController@photos`,
    `Provider\JobPhotoController`, `ProviderController@avatar`,
    `ProviderDocumentController@store` (multipart part); add `media_ids`/`*_media_id`
    handling to `AssetController` store/update, the answer/profile/document/job
    flows; routes in `customer_api.php` + `provider_api.php`.
  - Shared — a single `uploadPhotos` helper + `media` types.
  - Customer app — `photos.ts` (one helper), asset `new`/`edit`, request wizard
    (already upload-first), question answer flow, `queries.ts`/`api.ts`.
  - Provider app — `photos.ts`, worklog before/after, avatar, documents,
    `queries.ts`/`api.ts`.
- **API change**: 6 endpoints removed, their behavior folded into existing
  create/update/action payloads (`media_ids` / `photo_media_id` / `avatar_media_id`
  / `media_id` / `phase`). All callers migrated in the same change — no orphans.
- **Out of scope**: non-image uploads, resumable/chunked uploads, and changing the
  underlying storage (still the `public` disk via `MediaService`).
