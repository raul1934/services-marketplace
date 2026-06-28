# Design — add-polymorphic-media

## Schema
```
media
  id
  mediable_type   string  nullable   -- null while orphan (uploaded, not attached)
  mediable_id     bigint  nullable
  uploaded_by_id  bigint  nullable   FK users nullOnDelete
  disk            string  default 'public'
  path            string
  tag             string  nullable   -- 'request'|'before'|'after'|'surcharge'|'dispute'|'update'
  position        int     default 0
  timestamps
  index (mediable_type, mediable_id)
  index (mediable_id)               -- orphan sweep by created_at
```

`Media` model: `mediable()` morphTo, `uploadedBy()` belongsTo, `getUrlAttribute()`
= `Storage::disk($disk)->url($path)`, `$appends = ['url']`.

`HasMedia` trait: `media(): MorphMany`, `mediaByTag(string|array $tag)`. Applied to
`ServiceRequest`, `Surcharge`, `DisputeEvidence`, `JobUpdate`.

## Migration & backfill (one migration, reversible-in-dev)
1. Create `media`.
2. Backfill, preserving `created_at` / `uploaded_by_id`:
   - `request_photos` → `media` (mediable = ServiceRequest, tag = phase)
   - each path in `surcharges.photos` → `media` (mediable = Surcharge, tag `surcharge`)
   - each path in `dispute_evidence.photos` → `media` (mediable = DisputeEvidence, tag `dispute`)
   - `job_updates.photo_path` (when set) → `media` (mediable = JobUpdate, tag `update`)
3. Drop `request_photos` table; drop `surcharges.photos`, `dispute_evidence.photos`,
   `job_updates.photo_path` columns.

`down()` recreates the structures (data not restored — acceptable in dev; we run
`migrate:fresh --seed`). Backfill runs in chunks to stay memory-safe.

## Upload-first flow
- `POST /uploads` → `UploadController@store`: validate `file` (single) or `files[]`
  (`image`, `max:5120`); store under `uploads/{userId}/…`; create `media` with
  `mediable_*` NULL, `uploaded_by_id = auth id`, optional `tag`; return
  `MediaResource::collection` (`[{id, url}]`).
- **Attach**: a request that owns media accepts `media_ids: int[]`. A small
  `MediaService::attach($ids, $owner, $tag, $uploaderId)` re-parents only media
  that are (a) still orphan and (b) owned by the same uploader — preventing
  hijacking someone else's upload id. Used by:
  - create request (tag `request`)
  - job-photos (tag `before`/`after`)
  - surcharge (tag `surcharge`), dispute evidence (tag `dispute`)
- **Back-compat**: existing multipart endpoints still accept files directly — they
  upload then attach in one request (so native's single-call flow is unchanged).
  The wizard uses upload-first (upload as picked, attach on submit).

## Orphan cleanup
`media:prune-orphans` console command deletes `media` where `mediable_id IS NULL`
AND `created_at < now()-24h`, removing the file from disk too. Registered in the
scheduler (hourly). Guards against unbounded growth from abandoned wizards.

## Resources (no screen-shape change)
- `MediaResource`: `{ id, url, tag }`.
- `ServiceRequestResource`: `photos` = media tag `request`; `before_photos` = tag
  `before`; `after_photos` = tag `after` — same `{ id, url }` shape the app already
  consumes, so `RequestPhoto`-based screens need no change.
- Surcharge / dispute resources: `photos` → media urls by tag.

## Frontend
- shared `api`: `uploadMedia(files: PickedPhoto[]): Promise<{id:number;url:string}[]>`
  (multipart via the existing web-aware `appendPhoto`); a `useUploadMedia` hook.
- `request/new` wizard: upload each picked photo immediately → hold `media_ids`
  + preview thumbnails (from returned `url`); send `media_ids` in `createRequest`.
- job-photos / surcharge / dispute: keep current multipart call (now backed by
  media server-side) — no client change required beyond what already works.
- Types: add `Media` (`{id, url, tag?}`); keep request `photos/before_photos/
  after_photos` typed as `{id, url}` (unchanged).

## Verification
- Feature tests: upload → orphan media; attach via create → re-parented + tagged;
  cannot attach another user's orphan; prune removes only old orphans; request
  resource still emits `photos/before_photos/after_photos`.
- Migration test on seeded data: counts in `media` match the pre-migration sources.
- Frontend typecheck (shared + both apps); `migrate:fresh --seed` green with
  `DevJobSeeder` writing `media`.
