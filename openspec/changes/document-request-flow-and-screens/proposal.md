# Document the category-driven request flow and the full screen map

## Why

There is no single spec that answers: **for a given service category, what does the
customer fill in when creating a request, what does the provider see, and what does each
side see at every phase of the request?** The behavior is spread across the create-request
wizard, the customer request screen, the provider job screen, the bid wizard, and the
worklog — plus a backend question/asset model. New categories are added regularly, and we
keep re-deriving the same mapping by hand.

The key structural fact (verified in code) is small and reusable: **per-category variation
is confined to exactly two things** — (1) the *asset selector* and (2) the *dynamic intake
questions*. Every other part of the request — phases, statuses, screens, CTAs, payment,
receipt, surcharge, reschedule, dispute, warranty — is **category-agnostic**. Capturing
that as requirements lets anyone reproduce the field map for any `categoryId` in minutes.

There is also no inventory of the app screens; this change adds one.

## What changes

Documentation only — **no code changes**. Adds two new capability specs:

- **`request-lifecycle`** — the category-parameterized request requirements: how a category
  derives its asset selector + intake questions (with a reusable *Per-Category Worksheet*
  and **category 8 = "Vidro / Parabrisa"** as the worked example), the create-request wizard
  fields, the phase model, and what the **customer** and **provider** each see at every phase.
- **`screen-map`** — the complete expo-router screen inventory for both apps (customer 29
  screens, provider 26 screens), grouped by area, with route → purpose → phase.

Once this change is archived, the two specs become living specs under `openspec/specs/`.

## Impact

- **Affected specs**: `request-lifecycle` (new), `screen-map` (new).
- **Affected code**: none. Cross-references existing code as the source of truth
  (`RequestStatus`, `AssetType::forCategoryType`, `ServiceCategory::questions/categoryQuestions`,
  `QuestionSeeder`, `CategoryResource`, the create-request wizard, the request/job screens).
- **Reproducibility**: the `request-lifecycle` spec includes the exact `tinker` queries and a
  fill-in worksheet so the field map can be regenerated for any category.
- **Out of scope**: the admin app, backend API contract specs, and any behavior change.
