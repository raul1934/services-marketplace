# V5 screen coverage

Every V5 screen mapped to its route + the spec that covers it. Legend:
✅ own route · ⤵ inline state of another screen · ⛔ not implemented (deferred).

Seeded request ids (after `migrate:fresh --seed`): guincho **1** (open+bids),
bateria **2** (open, dev bid), pneu **3** (accepted), combustível **4** (expired),
chaveiro **5** (cancelled), mecânico **6** (in_progress, parts+surcharge),
encanador **13** (completed), eletricista **14** (requote). Asset ids 1–3.

## Customer
| V5 | Screen | Route | Cov | Spec |
|----|--------|-------|-----|------|
| C01 | SignUp | `/(auth)/register` | ✅ | auth |
| C02 | Login | `/(auth)/login` | ✅ | auth |
| C03 | Verify | `/(auth)/verify` | ✅ | auth (loads) |
| C04 | Tutorial | `/(auth)/welcome` | ✅ | auth |
| C05 | Home | `/(tabs)/home` | ✅ | home |
| C06 | Categories | `/categories` | ✅ | categories |
| C07 | Create · vehicle | `/request/new?categoryId=1` | ✅ | create-request |
| C08 | Create · home | `/request/new?categoryId=13` | ✅ | create-request |
| C09 | Published | `/request/1` (open) | ✅ | request-detail |
| C10/C11 | Q&A | inline `/request/1` | ⤵ | request-detail |
| C12 | Proposals | `/request/1/proposals` | ✅ | proposals |
| C13 | Proposal detail | inline proposals | ⤵ | proposals |
| C14 | Confirm match | inline proposals (slide) | ⤵ | proposals |
| C15 | Tracking | `/request/3/track` | ✅ | tracking |
| C16 | Surcharge | `/request/6/surcharge` | ✅ | actions |
| C17 | Job code | inline `/request/3` (start code card) | ⤵ | request-detail |
| C18 | In service | `/request/6` (in_progress) | ✅ | request-detail |
| C19 | Approve part | inline `/request/6` | ⤵ | request-detail |
| C20 | Receipt | `/request/13/receipt` | ✅ | requests |
| C21 | Rate | `/request/13/rate` | ✅ | actions |
| C22 | Assets | `/assets` | ✅ | assets |
| C23 | Add asset | `/assets/new` | ✅ | assets |
| C24 | Edit asset | `/assets/1` | ✅ | assets |
| C25 | Asset history | `/assets/1` | ⤵ | assets |
| C26 | Service detail | — | ⛔ | — |
| C27 | My requests | `/(tabs)/requests` | ✅ | requests |
| C28 | Request detail | `/request/13` | ✅ | request-detail |
| C29 | Decision (expired) | `/request/4` (expired) | ✅ | request-detail |
| C30 | Republished | — | ⛔ | — |
| C31 | Open bidding | — | ⛔ | — |
| C32 | Window reopened | — | ⛔ | — |
| C33 | Cancel | inline proposals | ⤵ | proposals |
| C34 | Cancelled ok | `/request/5` (cancelled) | ✅ | request-detail |
| C35 | No-show | `/request/3/no-show` | ✅ | actions |
| C36 | Reopened+refund | reuses no-show | ⤵ | actions |
| C37/C38 | Dispute | `/request/13/dispute` | ✅ | actions |
| C39 | Payment failure | — | ⛔ | (no gateway) |
| C40 | Re-quote | `/request/14/requote` | ✅ | actions |
| C41/C42 | Warranty | `/request/13/warranty` | ✅ | actions |
| C43 | Reschedule | `/request/3/reschedule` | ✅ | actions |

## Provider
| V5 | Screen | Route | Cov | Spec |
|----|--------|-------|-----|------|
| P01 | Sign up pro | `/(auth)/register` | ✅ | auth |
| P02 | Onboarding | `/onboarding` | ✅ | onboarding |
| P03 | Pending | `/pending` | ✅ | onboarding |
| P04 | Dashboard | `/(tabs)/dashboard` | ✅ | dashboard |
| P05 | Nearby list | `/nearby` | ✅ | nearby |
| P06 | Nearby map | `/nearby` (map view) | ⤵ | nearby |
| P07 | Scheduled cal | `/nearby` (agenda view) | ⤵ | nearby |
| P08 | Ask client | inline `/job/1/bid` | ⤵ | bid |
| P09 | Bid | `/job/1/bid` | ✅ | bid |
| P10/P11 | Bid flows | `/job/1/bid` | ⤵ | bid |
| P12 | Bid sent | `/job/2` (dev bid) | ✅ | job-detail |
| P13 | Bid accepted | `/job/3` (accepted) | ✅ | job-detail |
| P14 | Start (code) | inline `/job/3` (start code) | ⤵ | job-detail |
| P15 | Surcharge | `/job/6/surcharge` | ✅ | actions |
| P16 | Active job | `/job/6` (in_progress) | ✅ | job-detail |
| P17 | Add part | inline `/job/6` | ⤵ | job-detail |
| P18 | Rate client | `/job/13/rate-client` | ✅ | actions |
| P19 | Dispute defense | `/job/13/dispute` | ✅ | actions |
| P20 | Account hub | `/(tabs)/profile` | ✅ | account |
| P21 | Edit profile | `/edit-profile` | ✅ | account |
| P22 | Manage services | `/config` | ✅ | account |
| P23 | Earnings | `/earnings` | ✅ | account |
| P24 | Agenda | `/(tabs)/agenda` | ✅ | agenda |
| P25 | Reschedule | `/job/3/reschedule` | ✅ | actions |
