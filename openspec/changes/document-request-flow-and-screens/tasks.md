# Tasks — document the request flow & screen map

## 1. `request-lifecycle` spec
- [x] 1.1 Capture the **Per-Category Derivation** procedure (type → asset_type via `AssetType::forCategoryType`; intake = type-level `questions` + `categoryQuestions` merged by `sort_order`) with the exact `tinker` dump commands.
- [x] 1.2 Provide a blank **Per-Category Worksheet** template and fill it in for **category 8** (Vidro / Parabrisa).
- [x] 1.3 Requirement: category determines the asset selector (vehicle/property/pet/none).
- [x] 1.4 Requirement: category determines the dynamic intake questions (merge + asset-dedup).
- [x] 1.5 Requirement: create-request wizard fields & steps + submit payload.
- [x] 1.6 Requirement: intake answers + asset visibility (provider sees `AnswerList`; customer reviews at creation, not echoed back).
- [x] 1.7 Requirement: phase model & transitions (category-agnostic).
- [x] 1.8 Requirement: customer per-phase view (open/accepted/in_progress/completed/requote + sub-screens).
- [x] 1.9 Requirement: provider per-phase view (open lead/accepted/in_progress/completed + bid/worklog/start-code/sub-screens).

## 2. `screen-map` spec
- [x] 2.1 Requirement: customer app screen inventory (route table, grouped) — 29 screens.
- [x] 2.2 Requirement: provider app screen inventory (route table, grouped) — 26 screens.
- [x] 2.3 Requirement: tab navigation per app (customer 3 tabs; provider 5 tabs).

## 3. Validate
- [x] 3.1 Every `### Requirement:` in both specs has ≥1 `#### Scenario:` (OpenSpec rule).
- [x] 3.2 Reproducibility self-test: a second category (residential/tow) — confirm the worksheet predicts its `asset_type` + questions via `tinker`.
- [x] 3.3 Category-8 spot-check matches the live DB (`asset_type=vehicle`, 0 intake questions).
