# request-lifecycle

Captures, **for any service category**, what fields the customer fills in when creating a
request and what the customer and provider each see at every phase of that request. It is
written so the mapping can be **reproduced for a new category** by filling in one worksheet.

**The only per-category variation is (1) the asset selector and (2) the dynamic intake
questions.** Everything else below — wizard steps, phases, screens, CTAs, payment, receipt,
surcharge, reschedule, dispute, warranty — is identical for every category.

Source of truth in code: `backend/app/Enums/RequestStatus.php`, `backend/app/Enums/AssetType.php`,
`backend/app/Models/ServiceCategory.php`, `backend/database/seeders/QuestionSeeder.php`,
`backend/app/Http/Resources/CategoryResource.php` (`asset_type` at `:17`),
`frontend/apps/customer/app/request/new.tsx`, `frontend/apps/customer/app/request/[id]/index.tsx`,
`frontend/apps/provider/app/job/[id]/index.tsx`, `…/job/[id]/bid.tsx`, `…/job/[id]/worklog.tsx`.

## Per-Category Derivation (reproducibility procedure)

To regenerate the field map for category `N`:

1. **Identify the category** — `ServiceCategory::find(N)` → `type` (a `CategoryType`) and `slug`.
2. **Asset selector** — `AssetType::forCategoryType(type)`:

   | CategoryType            | asset_type | Asset selector shown in creation step 1 |
   |-------------------------|------------|------------------------------------------|
   | `roadside`              | `vehicle`  | Vehicle picker (required)                |
   | `residential` / `condo` | `property` | Property picker (required)               |
   | `pet`                   | `pet`      | Pet picker (required)                     |
   | `beauty`                | `null`     | No asset step                            |

3. **Intake questions** = type-level **+** category-specific, merged and ordered by `sort_order`:
   ```php
   // type-level (category_type = type, service_category_id = null)
   ServiceCategory::find(N)->questions;
   // category-specific (service_category_id = N)
   ServiceCategory::find(N)->categoryQuestions;
   // each Question: key, type (text|select|number), required, half, text{pt,en}, options
   ```
   These render as `DynamicFields` in creation and are later shown to the provider via
   `AnswerList`. Questions whose `key` is already answered by the chosen asset (`floor`,
   `unit`, `address`) are hidden in the wizard.

Distribution at time of writing — type-level: `roadside` 0, `residential` 3 (access/unit/floor),
`beauty` 2, `pet` 2, `condo` 0; plus 33 category-specific questions across roadside subtypes
(tow, battery, tire, fuel, locksmith, mechanical) and residential subtypes (plumbing,
electrical, locksmith, cleaning, AC, …).

### Per-Category Worksheet (template)

| Field | Value |
|---|---|
| Category id / name / slug | |
| `type` (CategoryType) | |
| `asset_type` | |
| Asset selector | vehicle / property / pet / none |
| Intake questions (`key · type · req · half`) | |
| Creation steps shown | details, [photos], [location], when, money, review |
| Phase deltas vs. this spec | usually **none** |

### Worked example — category 8

| Field | Value |
|---|---|
| Category id / name / slug | `8` / *Vidro / Parabrisa* / `vidro-automotivo` |
| `type` | `roadside` |
| `asset_type` | `vehicle` |
| Asset selector | Vehicle picker (required) |
| Intake questions | **none** (0 type-level + 0 category-specific) |
| Creation steps shown | details, photos, location, when, money, review |
| Phase deltas | none |

So a category-8 request is: pick a vehicle → describe the problem → (optional photos) → GPS +
access → urgent/scheduled → budget + payment → review. No dynamic questions appear.

## ADDED Requirements

### Requirement: A category determines which asset a request is tied to
The create-request wizard SHALL show an asset selector keyed to the category's `asset_type`,
where `asset_type = AssetType::forCategoryType(category.type)` (`roadside→vehicle`,
`residential|condo→property`, `pet→pet`, `beauty→null`). When `asset_type` is non-null the
asset selection SHALL be required to leave step 1; when it is null no asset step SHALL appear.
The chosen asset is submitted as `asset_id` and displayed to both sides on the request.

#### Scenario: Roadside category requires a vehicle (category 8)
- WHEN the customer starts a request for category 8 (`roadside`, `asset_type=vehicle`)
- THEN step 1 shows the **vehicle** asset selector and the "Continue" action stays disabled until a vehicle is selected (and a ≥5-char description is entered)

#### Scenario: Residential category requires a property
- WHEN the category type is `residential` or `condo`
- THEN step 1 shows the **property** asset selector (required)

#### Scenario: Pet category requires a pet
- WHEN the category type is `pet`
- THEN step 1 shows the **pet** asset selector (required)

#### Scenario: Category with no asset type
- WHEN `AssetType::forCategoryType(type)` is `null` (e.g. `beauty`)
- THEN no asset selector is shown and no `asset_id` is submitted

### Requirement: A category determines the dynamic intake questions
The wizard SHALL render, as `DynamicFields` in step 1, the category's intake questions =
type-level questions (`category_type = type`, `service_category_id = null`) **plus**
category-specific questions (`service_category_id = N`), ordered by `sort_order`. A question
whose `key` is already satisfied by the selected asset (`floor`, `unit`, `address`) SHALL be
hidden. Answered questions SHALL be submitted as `answers: [{ question_id, answer }]`.

#### Scenario: Category 8 has no intake questions
- WHEN the customer reaches step 1 for category 8
- THEN no dynamic question fields are rendered (0 type-level + 0 category-specific) and only the vehicle selector and description appear

#### Scenario: Residential category adds access/unit/floor
- WHEN the category type is `residential`
- THEN the dynamic fields include `access` (select), `unit` (half), and `floor` (half)

#### Scenario: Tow category adds its own questions
- WHEN the category is the roadside tow subtype
- THEN the dynamic fields include `destination`, `starts`, `wheels_locked`, and `location_type`

#### Scenario: A question the asset already answers is hidden
- WHEN the selected property asset already has a `floor`/`unit`/`address`
- THEN the matching question is not rendered again in the wizard

### Requirement: Create-request is a stepped wizard with category-parameterized fields
Creating a request SHALL be the wizard `details → photos → location & access → when →
money → review`, ending in a read-only review. The `location` step SHALL be skipped when the
selected property asset already carries a location (derived from the asset; the access block
then moves into step 1). Step 1 fields = asset selector (if any) + description + dynamic
questions. The submit payload SHALL be
`{ service_category_id, asset_id?, description, latitude, longitude, address?, budget_max,
payment_method, answers[], urgency, reception_type, entry_code?, availabilities?, media_ids? }`.

#### Scenario: Full wizard for category 8
- WHEN the customer completes a category-8 request
- THEN they pass through details (vehicle + description) → photos (optional, ≤5) → location & access (GPS + address + reception) → when (urgent/scheduled) → money (budget + payment) → review, then submit

#### Scenario: Location step skipped for a located property asset
- WHEN the selected property asset has `latitude`/`longitude`
- THEN the `location` step is removed, the request uses the asset's location, and the access block is shown in step 1

#### Scenario: Review is a read-only synthesis
- WHEN the customer reaches the final step
- THEN it lists service, asset, description, each answered question, photo count, address, access, schedule, budget, and payment, each tappable to jump back to its step

### Requirement: Intake answers and asset are surfaced to the provider
The provider SHALL see the client's intake `answers` (via `AnswerList`) and the linked asset
card while reviewing an open lead, and the asset card in later phases. The customer enters and
reviews these answers during creation and the customer request screen SHALL NOT echo them back
as a separate answers list.

#### Scenario: Provider sees the answers on the bid review
- WHEN the provider opens the bid wizard for a request that has intake answers
- THEN bid step 1 shows the asset card and an `AnswerList` of the client's answers

#### Scenario: Category 8 bid review has an asset but no answers list
- WHEN the provider opens the bid for a category-8 request (0 intake questions)
- THEN the vehicle asset card is shown and no answers list is rendered

### Requirement: Request phases and transitions are category-agnostic
A request SHALL move through `open → accepted → in_progress → completed`, with the terminal
states `cancelled` and `expired`, plus the `requote` pause. `accepted` and `in_progress` are
"active" (live tracking); `completed`, `cancelled`, `expired` are "closed". These phases and
the screens for them SHALL be identical regardless of category.

#### Scenario: Forward path
- WHEN a request is created
- THEN it starts `open`; accepting a proposal moves it to `accepted`; starting moves it to `in_progress`; completing moves it to `completed`

#### Scenario: Requote pause
- WHEN a mandatory re-quote is triggered (surcharge > 50% or scope change)
- THEN the request enters `requote` and the customer must accept the new quote or reopen to others

### Requirement: Customer sees phase-appropriate sections on the request screen
The customer request screen (`request/[id]`) SHALL render, by status: **open** — inline
proposals (sortable), each bid card carrying that provider's pre-bid Q&A inline (there SHALL
be no standalone pre-bid Q&A section on the request screen); **accepted/in_progress** (active)
— live map + ETA + progress strip, provider card, start code (urgent only), parts-approval
prompt, pending surcharge card, pending reschedule, and reschedule/no-show links; **requote**
— a re-quote card; **completed** — receipt, consolidated summary (provider/timeline/parts),
warranty/dispute actions, and the rating prompt (see the rating-prompt requirement). The
linked asset card and before/after photos SHALL appear whenever present. Sub-screens: `track`
(folded into detail), `rate`, `receipt`, `requote`, `reschedule`, `surcharge`, `warranty`,
`dispute`, `no-show`.

#### Scenario: Open request
- WHEN the request is `open`
- THEN the screen shows the sortable proposals list, with each provider's questions rendered inside that provider's bid card, and no tracking/receipt sections

#### Scenario: Active request (urgent)
- WHEN the request is `accepted` or `in_progress` and urgent
- THEN the screen shows the live map + ETA + progress strip, the provider card, and the start-code card; a pending surcharge or parts-approval prompt appears when present

#### Scenario: Completed request
- WHEN the request is `completed`
- THEN the screen shows the receipt, the summary (provider, timeline, parts used), and warranty/dispute actions, with the rating prompted on top while unrated

### Requirement: A provider's questions are answerable by the customer only after the bid is published
A provider's pre-bid questions SHALL become visible and answerable to the customer only once
that provider has published a bid (a live `pending`/`accepted` proposal on the request); they
SHALL appear inside that provider's bid card. The backend customer questions endpoint SHALL
return only questions from providers who have a live proposal, and answering a question whose
provider has not bid SHALL be rejected (422).

#### Scenario: Questions hidden until the bid is published
- WHEN a provider has asked questions but has not published a bid
- THEN the customer sees no questions for that provider, and an attempt to answer is rejected (422)

#### Scenario: Questions appear inside the published bid
- WHEN a provider publishes a bid
- THEN that provider's questions appear inside their bid card and the customer can answer them there

### Requirement: Rating is prompted on top of the completed request, re-prompted, and closeable
When a request is `completed` and the viewer has not yet rated, the rate screen SHALL open on
top automatically, SHALL re-open each time the screen regains focus, SHALL be closeable, and
SHALL leave a pinned "Rate" button while unrated. Other completed-state actions (receipt,
warranty, dispute) SHALL remain usable (the prompt is persistent, not a hard block). This
applies to both the customer (rating the provider) and the provider (rating the client).

#### Scenario: Auto-prompt on completion
- WHEN the viewer opens a completed, unrated request
- THEN the rating screen opens over the request screen

#### Scenario: Re-prompt on return
- WHEN the viewer closes the rating screen, navigates away, and returns while still unrated
- THEN the rating screen opens again, and a pinned "Rate" button is shown meanwhile

#### Scenario: Closeable, not blocking
- WHEN the viewer closes the rating screen
- THEN they can still use the other completed actions, and submitting a rating clears the prompt and the pinned button

### Requirement: Provider sees phase-appropriate controls on the job screen
The provider job screen (`job/[id]`) SHALL render, by status: **open lead** — summary + asset
+ full-screen map and a "send bid" CTA (or an "already bid" pill); **accepted** — start control
pinned to the footer (urgent → 4-cell start-code modal; scheduled → slide-to-start), client
card, job stats, surcharge/reschedule actions, and the worklog entry; **in_progress** — the
same plus the complete slide; **completed** — the client's rating when present, plus a
dispute-defense action (the rate-client form is prompted on top per the rating requirement).
The bid wizard's questions step SHALL split the Q&A into two tabs — **"Your questions"**
(editable: ask up to the max, pick suggestions, remove own) and **"Other pros questions (N)"**
(read-only, N = count of other providers' questions). The worklog screen (`job/[id]/worklog`)
SHALL hold before/after photos (shared with client), parts add/remove + payout breakdown,
odometer (vehicles only), the "request approval of the running total" action (in_progress), and
work notes. Sub-screens: `bid`, `worklog`, `surcharge`, `reschedule`, `rate-client`, `dispute`.

#### Scenario: Open lead
- WHEN the provider opens an `open` request in their category
- THEN the screen shows the summary, asset, and a full-screen map with a "send bid" CTA, unless they already bid (then an "already bid" pill shows their price)

#### Scenario: Bid Q&A split into Your / Other pros tabs
- WHEN the provider opens the bid wizard's questions step
- THEN a "Your questions" tab lets them ask/remove their own questions and an "Other pros questions (N)" tab shows other providers' questions read-only (N = count)

#### Scenario: Urgent job start requires the client's code
- WHEN the provider starts an `accepted` urgent job
- THEN a 4-cell start-code modal opens and the job starts only with the correct code

#### Scenario: In-progress worklog and approval
- WHEN the job is `in_progress`
- THEN the worklog accepts before/after photos and parts, shows the labor/parts/fee/payout breakdown, lets the provider request the client's approval of the running total, and (for vehicles) record the odometer

#### Scenario: Completed job rating
- WHEN the job is `completed`
- THEN the provider sees the client's rating if present, plus a dispute-defense action, and is prompted on top to rate the client while unrated (per the rating requirement)
