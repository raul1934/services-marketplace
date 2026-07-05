# screen-map

A complete inventory of the expo-router screens in both apps, grouped by area, with the
resolved route and purpose. Routes are derived from the file tree under each app's `app/`
directory; `(auth)` and `(tabs)` are route *groups* (they do not appear in the URL).
Source of truth: `frontend/apps/customer/app/**` (29 screens) and
`frontend/apps/provider/app/**` (26 screens).

## ADDED Requirements

### Requirement: Customer app screen inventory
The customer app SHALL provide the following screens (file → route → purpose):

**Root / shell**
| File | Route | Purpose |
|---|---|---|
| `app/_layout.tsx` | — | Root layout (theme `yeti`, auth gate, providers) |
| `app/index.tsx` | `/` | Entry redirect (to tabs or auth) |
| `app/+not-found.tsx` | `*` | 404 fallback |

**Auth** (`(auth)` group)
| File | Route | Purpose |
|---|---|---|
| `(auth)/_layout.tsx` | — | Auth stack layout |
| `(auth)/welcome.tsx` | `/welcome` | Intro / brand landing |
| `(auth)/login.tsx` | `/login` | Phone-OTP or email/password login |
| `(auth)/register.tsx` | `/register` | Account creation |
| `(auth)/verify.tsx` | `/verify` | OTP code verification |

**Tabs** (`(tabs)` group — 3 tabs)
| File | Route | Purpose |
|---|---|---|
| `(tabs)/_layout.tsx` | — | Tab bar |
| `(tabs)/home.tsx` | `/home` | Home: categories entry + active requests |
| `(tabs)/requests.tsx` | `/requests` | Request history (paginated, status filter) |
| `(tabs)/profile.tsx` | `/profile` | Customer profile / settings |

**Create a request**
| File | Route | Purpose |
|---|---|---|
| `categories.tsx` | `/categories` | Pick a service category |
| `request/new.tsx` | `/request/new?categoryId=` | Create-request wizard (see `request-lifecycle`) |

**Request detail & phase actions**
| File | Route | Purpose |
|---|---|---|
| `request/[id]/index.tsx` | `/request/[id]` | Request detail — all phases (proposals, tracking, receipt, …) |
| `request/[id]/proposals.tsx` | `/request/[id]/proposals` | Legacy proposals route → redirects to detail |
| `request/[id]/track.tsx` | `/request/[id]/track` | Live tracking (now folded into detail) |
| `request/[id]/rate.tsx` | `/request/[id]/rate` | Rate the provider (completed) |
| `request/[id]/receipt.tsx` | `/request/[id]/receipt` | Payment receipt (completed) |
| `request/[id]/requote.tsx` | `/request/[id]/requote` | Accept/decline a mandatory re-quote |
| `request/[id]/reschedule.tsx` | `/request/[id]/reschedule` | Propose/answer a reschedule |
| `request/[id]/surcharge.tsx` | `/request/[id]/surcharge` | Review/approve a surcharge |
| `request/[id]/warranty.tsx` | `/request/[id]/warranty` | Open a warranty claim (completed) |
| `request/[id]/dispute.tsx` | `/request/[id]/dispute` | Open a dispute (completed) |
| `request/[id]/no-show.tsx` | `/request/[id]/no-show` | Report a no-show (active) |

**Assets** (vehicles / properties / pets)
| File | Route | Purpose |
|---|---|---|
| `assets/index.tsx` | `/assets` | Asset list (paginated) |
| `assets/new.tsx` | `/assets/new?pick=&type=` | Create an asset (optionally pick-mode for the wizard) |
| `assets/[id]/index.tsx` | `/assets/[id]` | Asset detail (incl. location/geofence) |
| `assets/[id]/edit.tsx` | `/assets/[id]/edit` | Edit an asset |

#### Scenario: Request detail route exists for all phases
- WHEN navigating to `/request/[id]`
- THEN the request detail screen renders the phase-appropriate sections (per the `request-lifecycle` spec)

#### Scenario: Create-request entry
- WHEN the customer taps a category on `/categories`
- THEN `/request/new?categoryId=` opens the create-request wizard

#### Scenario: Legacy proposals URL redirects
- WHEN navigating to `/request/[id]/proposals`
- THEN it redirects to `/request/[id]`

### Requirement: Provider app screen inventory
The provider app SHALL provide the following screens (file → route → purpose):

**Root / shell & onboarding**
| File | Route | Purpose |
|---|---|---|
| `app/_layout.tsx` | — | Root layout (theme, auth gate) |
| `app/index.tsx` | `/` | Entry redirect |
| `app/+not-found.tsx` | `*` | 404 fallback |
| `onboarding.tsx` | `/onboarding` | Provider onboarding (categories, area, profile) |
| `pending.tsx` | `/pending` | Awaiting approval state |

**Auth** (`(auth)` group)
| File | Route | Purpose |
|---|---|---|
| `(auth)/_layout.tsx` | — | Auth stack layout |
| `(auth)/welcome.tsx` | `/welcome` | Intro / brand landing |
| `(auth)/login.tsx` | `/login` | Login |
| `(auth)/register.tsx` | `/register` | Account creation |
| `(auth)/verify.tsx` | `/verify` | OTP verification |

**Tabs** (`(tabs)` group — 5 tabs)
| File | Route | Purpose |
|---|---|---|
| `(tabs)/_layout.tsx` | — | Tab bar |
| `(tabs)/dashboard.tsx` | `/dashboard` | Today: active jobs + nearby summary |
| `(tabs)/nearby.tsx` | `/nearby` | Nearby open leads (list / agenda / map by viewport) |
| `(tabs)/jobs.tsx` | `/jobs` | My jobs + my bids (paginated) |
| `(tabs)/agenda.tsx` | `/agenda` | Scheduled jobs by day |
| `(tabs)/profile.tsx` | `/profile` | Provider profile / account |

**Job detail & phase actions**
| File | Route | Purpose |
|---|---|---|
| `job/[id]/index.tsx` | `/job/[id]` | Job control — all phases (lead, start/complete, management) |
| `job/[id]/bid.tsx` | `/job/[id]/bid` | 4-step bid wizard (review, Q&A, price, summary) |
| `job/[id]/worklog.tsx` | `/job/[id]/worklog` | Worklog: photos, parts, payout, odometer, notes |
| `job/[id]/surcharge.tsx` | `/job/[id]/surcharge` | Propose a surcharge |
| `job/[id]/reschedule.tsx` | `/job/[id]/reschedule` | Propose/answer a reschedule |
| `job/[id]/rate-client.tsx` | `/job/[id]/rate-client` | Rate the client |
| `job/[id]/dispute.tsx` | `/job/[id]/dispute` | Dispute defense |

**Settings**
| File | Route | Purpose |
|---|---|---|
| `config.tsx` | `/config` | App settings (language, etc.) |
| `edit-profile.tsx` | `/edit-profile` | Edit profile (incl. insurance toggle) |
| `earnings.tsx` | `/earnings` | Wallet: balance + paginated transactions |

#### Scenario: Job detail route exists for all phases
- WHEN navigating to `/job/[id]`
- THEN the job screen renders the phase-appropriate controls (per the `request-lifecycle` spec)

#### Scenario: Bid wizard route
- WHEN the provider taps "send bid" on an open lead
- THEN `/job/[id]/bid` opens the 4-step bid wizard

### Requirement: Tab navigation per app
The customer app SHALL present **3** bottom tabs (`home`, `requests`, `profile`); the provider
app SHALL present **5** bottom tabs (`dashboard`, `nearby`, `jobs`, `agenda`, `profile`).

#### Scenario: Customer tabs
- WHEN the authenticated customer is in the app
- THEN the tab bar shows Home, Requests, and Profile

#### Scenario: Provider tabs
- WHEN the authenticated, approved provider is in the app
- THEN the tab bar shows Dashboard, Nearby, Jobs, Agenda, and Profile
