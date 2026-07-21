# An express path for someone standing on the hard shoulder

## Why

The persona this app was built for is "aflito na estrada": car broken down at
night, battery low, stressed. What the app asks of that person is seven fixed
screens plus a slide gesture — around ten interactions — before anyone is even
told they need help.

Nothing is skipped. `questions` and `photos` render a full screen with a
"Continuar" button even when they are empty, and step 5 is nothing but "adicionar
foto". Fields appear that make no sense for the request: a roadside tow asks
"ACESSO: adulto com chave / código de acesso", which belongs to a home service.
Step 2 says "ajuste o pino" while no map is on screen until you tap "usar minha
localização". The address shown in step 2 does not match the one on review, because
two different reverse-geocode results are used.

Worst of all, for vehicle categories the flow refuses to start: the request
requires an asset, so "meu carro quebrou" is answered with "primeiro cadastre seu
carro" — and that sub-flow demands a nickname of at least two characters, so the
user must **name their car** before asking for a tow.

Then, at the end of that funnel, the confirmation is a slide gesture: friction
stacked on friction precisely where urgency is highest.

## What changes

An **express path** for urgent requests, and an **adaptive** one for everything
else. The target is not "N fixed steps"; it is removing the anti-patterns —
empty steps, out-of-context fields, mandatory assets.

- **REQ-01 / ASSET-02** — no asset required to request. Vehicle details are inline
  and optional (plate, model), and the nickname stops being mandatory in the picker
  flow. Registering the asset can be offered *after* help is on the way.
- **REQ-02** — urgent requests collapse to one or two screens: what happened,
  where you are, send. Everything else moves to after submission, while providers
  are already seeing the request.
- **REQ-04** — a step with nothing to show is never rendered.
- **REQ-09** — a plain confirm button in express mode; keep the slide only where a
  deliberate, reversible-cost gesture is warranted.
- **REQ-07 follow-through / REQ-08** — fields adapt to the category, and the copy
  stops promising a map that is not there.
- **REQ-06** — a skeleton on the location card while GPS and geocoding run.
- **REQ-13** — one address, resolved once, reused everywhere.

## Impact

- **Affected specs**: `customer`
- **Affected code**: `app/request/new.tsx` (the bulk), `src/components/AssetSelector.tsx`,
  `DynamicFields.tsx`, `app/assets/new.tsx` (picker mode), the location/geocode
  helper, and the create-request endpoint if the asset becomes optional there.
- **Findings**: REQ-01 (Crítico), REQ-02 (Crítico), REQ-04, ASSET-02, REQ-06,
  REQ-08, REQ-09, REQ-13.
- **Depends on**: `discovery-and-primary-action` — the express path needs an entry
  point that is always reachable, otherwise we shorten a funnel nobody can find.
- **Backend change**: `asset_id` becomes optional and vehicle details can arrive
  as loose attributes; decide whether an asset is created retroactively when the
  user later confirms it.
- **Measure it**: taps and time-to-submit for the urgent persona, before and after,
  recorded in `ux-audit/user-journey.md`. If the number does not drop, this change
  did not do its job.
