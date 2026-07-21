# Six exception screens that are really two patterns

## Why

The exception flows — surcharge, re-quote, reschedule, no-show, dispute, warranty —
are six full routes that reimplement roughly 80% of the same structure. They fall
into two families and pretending otherwise costs a screen each time:

- **Group A, decide something**: surcharge, re-quote, reschedule, no-show. The user
  approves, declines or picks. Each is entered from an inline card whose only job
  is to push to a route — a navigation hop for a decision that fits in a sheet.
- **Group B, open a case**: dispute and warranty. Near-identical forms with
  different labels; in dispute you cannot even remove a photo added by mistake.

The seams show. `surcharge.tsx` redirects to re-quote when `tier === 'requote'`, so
two screens that say almost the same thing bounce between each other. Success
feedback disagrees: surcharge and no-show-"esperar" do a silent `router.back()`
while re-quote and dispute pop an `Alert`. The reschedule screen asks for a date as
**text matching `^\d{4}-\d{2}-\d{2}$`** — no calendar, no mask — which is a
guaranteed error and unusable with a screen reader. And no-show draws its icon with
a 🕒 emoji at font size 40 instead of the icon system.

## What changes

- **EXC-01** — a native date picker on reschedule. This is the one to do first; it
  is a defect, not a refactor.
- **EXC-02** — Group A becomes inline sheets on the request screen (built on the
  shared `<Sheet>`); Group B becomes one parameterised `ClaimForm`.
- **EXC-03** — one destination for "the price changed"; end the surcharge↔re-quote
  bounce.
- **EXC-05** — `ClaimForm` for dispute and warranty, with photo removal.
- **EXC-04 follow-through / EXC-07** — uniform success feedback (already partly
  done) and a pinned footer on reschedule like its siblings.
- **EXC-06** — the icon system instead of an emoji.

## Impact

- **Affected specs**: `customer`
- **Affected code**: `app/request/[id]/{surcharge,requote,reschedule,no-show,dispute,warranty}.tsx`,
  the inline entry cards on `index.tsx`, and a new `ClaimForm`.
- **Findings**: EXC-01 (Crítico), EXC-02, EXC-03, EXC-05, EXC-06, EXC-07.
- **Depends on**: `design-system-foundations` for `<Sheet>`. Doing Group A before
  `<Sheet>` exists would produce a seventh copy of the modal.
- **Feeds**: `slim-request-detail`, which needs the exceptions out of the scroll.
- **Note**: EXC-01 does not need to wait for any of this — split it out if the
  refactor slips.
