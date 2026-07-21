# Design — express and adaptive request creation

## The decision

The wizard is a fixed array of seven steps. Making it adaptive means deciding
*what drives the shape*, and there are three candidates.

**Urgency only.** Two modes: express for urgent, full for scheduled. Simple, but
it ignores that a scheduled home service genuinely needs different fields than a
scheduled tow — the out-of-context "ACESSO" field is exactly this.

**Category only.** Each category declares the fields it needs. Fixes the wrong
fields, but does nothing for the person on the hard shoulder: a tow still walks the
full tow-shaped flow.

**Both, and they are different axes.** Category decides *which* fields exist;
urgency decides *when* they are asked. This is the model to implement.

## The model

Requesting has a **minimum viable request** — the smallest thing providers can bid
on — and everything beyond it is enrichment.

```
minimum viable request = category + location + description
```

- **Express (urgent)** asks only for the minimum, on one screen, and submits.
  Enrichment is offered afterwards, on the tracking screen, while bids arrive.
- **Full (scheduled)** asks for the minimum plus the category's fields, still
  skipping anything with nothing to show.

Providers see the request the moment the minimum is met. Waiting for photos before
telling anyone the car is broken is the anti-pattern.

## Consequences

- The asset stops being an input and becomes an *optional enrichment*. Vehicle
  details arrive as loose attributes; the app may offer to save them as an asset
  after the fact. This is what unblocks REQ-01 without losing the asset model.
- Photos, questions, budget and access details move to post-submit. They must edit
  the request in place, which the tracking screen already knows how to display.
- The step count stops being a constant, so `Wiz`'s progress indicator has to be
  computed from the steps that will actually render — not from a fixed total, or
  the bar will lie.
- A field set per category needs somewhere to live. Prefer server-driven
  (categories already come from the API) so adding a category does not require an
  app release.

## What we are not doing

- Not removing the full flow. Scheduled requests benefit from detail.
- Not queuing submissions offline — that is `offline-and-error-recovery`, and it
  should not be entangled with a flow redesign.
- Not touching the provider's bidding flow, beyond what a leaner request payload
  implies.

## How we will know it worked

Taps and time-to-submit for the "aflito na estrada" persona, measured on the device
the same way the audit measured them. The current baseline is roughly ten
interactions across seven screens. If express does not land in the low single
digits on one screen, the design failed, not the implementation.
