<?php

/*
|--------------------------------------------------------------------------
| Test Bots — TEMPORARY
|--------------------------------------------------------------------------
|
| Two bot systems that fill in the counterpart side of each app so a flow can
| be exercised without a second human:
|
|   - Customer Bot: fake PROVIDER accounts that auto-bid on open requests,
|     so the customer app has proposals to look at.
|   - Provider Bot: fake CLIENT accounts that post a request every couple of
|     minutes, so the provider app has jobs coming in.
|
| Everything here is off by default. Delete this file together with app/Bots
| when the bots are no longer needed.
|
*/

return [

    /*
    | Master switch. Nothing bot-related runs unless this is true — no
    | observers, no scheduled commands, no queued work. Keep it false in any
    | environment you are not actively testing in.
    */
    'enabled' => (bool) env('BOTS_ENABLED', false),

    // Per-system switches, so one env var can turn on only the half you need.
    'customer_bot' => (bool) env('BOTS_CUSTOMER_BOT', true),
    'provider_bot' => (bool) env('BOTS_PROVIDER_BOT', true),

    /*
    | Which Market (territory) the bots live in. Leave null to auto-pick the
    | first active market with a geofence — convenient locally, where the dev
    | seeder creates one. In PRODUCTION set this explicitly: bot providers are
    | scoped to this market, and bot requests are sampled inside its geofence.
    |
    | A synthetic market is never created. Under territory isolation a geofence
    | overlapping a real city would start capturing real customers' requests
    | into the bot territory — an incident, not test noise.
    */
    'market_id' => env('BOTS_MARKET_ID') ? (int) env('BOTS_MARKET_ID') : null,

    // Accounts created per side by `bots:seed`.
    'count' => (int) env('BOTS_COUNT', 5),

    'email_domain' => env('BOTS_EMAIL_DOMAIN', 'bot.chamafacil.test'),
    'password' => env('BOTS_PASSWORD', 'senha123'),

    /*
    | Gap between consecutive bot bids on the same request. Applied
    | cumulatively, so with the defaults five bids land at roughly
    | +15s, +30s, +45s, +60s, +75s — staggered rather than all at once.
    */
    'bid_delay_min_seconds' => (int) env('BOTS_BID_DELAY_MIN', 10),
    'bid_delay_max_seconds' => (int) env('BOTS_BID_DELAY_MAX', 20),

    /*
    | Blast-radius brakes. With full scope every real customer's request gets
    | bot bids, so these are the dial you turn down first in production.
    */
    'max_bids_per_request' => (int) env('BOTS_MAX_BIDS_PER_REQUEST', 5),
    'max_open_requests' => (int) env('BOTS_MAX_OPEN_REQUESTS', 10),
    'max_requests_per_day' => (int) env('BOTS_MAX_REQUESTS_PER_DAY', 200),

    /*
    | Bot clients accepting a real provider's bid. The delay is deliberate:
    | instant acceptance reads as robotic and skips the "aguardando resposta"
    | state the provider app is supposed to show.
    */
    'auto_advance' => (bool) env('BOTS_AUTO_ADVANCE', true),
    'accept_delay_seconds' => (int) env('BOTS_ACCEPT_DELAY', 45),

    // Prefix stamped on every user-visible string a bot writes.
    'label' => '[TESTE]',
];
