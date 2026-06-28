# Change: add-polymorphic-media

## Why
Images are stored three inconsistent ways today: a normalized `request_photos`
table (with `phase`), JSON path arrays on `surcharges.photos` and
`dispute_evidence.photos`, and single columns (`job_updates.photo_path`,
`users.avatar_path`, `assets.photo_path`). Adding images to any new entity means
inventing storage again, and there's no way to attach photos *before* the owning
record exists (e.g. while filling the create-request wizard).

This change introduces one **polymorphic `media` table** for user-generated
images and an **upload-first flow**: a generic endpoint stores a file and returns
`{ id, url }` immediately; the client passes the resulting ids when it creates or
updates the owning record, and the server re-parents them. Orphaned uploads are
pruned on a schedule.

## What changes (in scope)
- **`media` table** (`mediable_type`, `mediable_id` — both nullable while orphan —
  `uploaded_by_id`, `disk`, `path`, `tag`, `position`, timestamps) + `Media` model
  (morphTo `mediable`, `url` accessor) + a `HasMedia` trait (`morphMany`,
  `mediaByTag()`).
- **Migrate + backfill** the four multi-image features into `media`, then drop the
  old storage:
  - `request_photos` → `media` (tag = old `phase`: request/before/after)
  - `surcharges.photos` → `media` (tag `surcharge`)
  - `dispute_evidence.photos` → `media` (tag `dispute`)
  - `job_updates.photo_path` → `media` (tag `update`)
- **Generic upload endpoint** `POST /uploads` (customer + provider): accepts
  `file` / `files[]` (image, ≤5 MB), stores them, creates orphan `media`, returns
  `[{ id, url }]`.
- **Attach by id**: create/action requests accept `media_ids[]` (+ tag where
  relevant); the service re-parents the caller's orphan media onto the record.
  Existing multipart endpoints (request photos, job-photos, surcharge, dispute)
  keep working by internally upload-then-attaching, so native one-shot uploads
  still work alongside the wizard's upload-first.
- **Orphan cleanup**: a scheduled command prunes `media` with `mediable_id IS NULL`
  older than 24 h (and deletes the file).
- **Resources**: `MediaResource` (`id`, `url`, `tag`); `ServiceRequestResource`
  `photos`/`before_photos`/`after_photos` derive from `media` by tag; surcharge /
  dispute resources expose `media` urls. The frontend `RequestPhoto`-shaped types
  stay the same shape (`{ id, url }`), so screens don't change.

## Deferred (NOT in this change)
- **`users.avatar_path` and `assets.photo_path` stay as columns** — they're true
  1:1 images; a polymorphic row adds nothing. (Can fold in later if needed.)
- No CDN / image resizing / thumbnails — same disk + URL as today.

## Impact
- Backend: new `media` table + model + trait; data-migration of 4 features and
  drop of their old storage; `UploadController`; `media_ids[]` handling in the
  request/surcharge/dispute/job-photo services; a prune command + schedule entry;
  resource changes; updated `DevJobSeeder` (seed `media` instead of `request_photos`).
- Frontend: a shared `uploadMedia()` api + hook; the create-request wizard uploads
  as photos are picked and sends `media_ids[]`; other upload sites keep working.
  Screen-visible shapes (`{ id, url }`) unchanged.
- Risk: this rewrites working storage for 4 features with a backfill — the main
  reason it's its own change with tests and a careful migration.
