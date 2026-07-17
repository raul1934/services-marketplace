# Turn the app asset-first (home, alerts, onboarding, theme)

## Why

The app was born a tow-truck marketplace and still reads like one: the home
opened on "chamados ativos" and "ajuda rápida" (Guincho, Bateria, Troca de Pneu,
Combustível), while **assets** — the house, the car, the pet someone actually
looks after — were buried in the drawer behind a car icon. A new account had no
path to its first asset, and the app had no idea what the user owns.

Assets are the centre of gravity: a request is always *about* something, and the
asset is where the address, the measurements and the history live. Everything
here pulls the product toward that.

Two long-standing gaps came along for the ride: the bell was a dead button
(30 notification classes were being written to the database and never read), and
every screen ran under Android's nav buttons.

## What changes

- **Home** leads with the client's assets; the AR POC shortcut is gone.
- **Alerts** — the bell gets a real screen, a badge, and deep-links by type.
- **Onboarding** — a full-screen tutorial for accounts with no assets, in the
  language of *assets* (house, car, pet), not just property.
- **Safe areas** — content stops rendering under the system nav bar.
- **Theme** — the picker offers modes (auto/light/dark) instead of brand
  palettes, and the choice survives a restart.
- **Sensible defaults** — with exactly one asset of the needed type, the request
  wizard picks it and says so.

## Non-goals

- **Inventing facts.** Seeded defaults may pre-select *choices* (which rooms to
  offer; the only asset there is). They must never fill in *measurements or
  attributes* — `size: "120 m²"`, `fuel: "Flex"` — that nobody confirmed. A
  measurement nobody took becomes a quote, and then a dispute.
- Push and realtime are tracked here but gated behind a native rebuild.
