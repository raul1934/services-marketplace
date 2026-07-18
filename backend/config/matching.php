<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Provider matching
    |--------------------------------------------------------------------------
    |
    | How far and how many online providers get notified when a new request
    | is created. See App\Services\MatchingService::onlineProvidersNear().
    |
    */

    'radius_km' => env('MATCHING_RADIUS_KM', 30),

    'provider_limit' => env('MATCHING_PROVIDER_LIMIT', 50),

    /*
    |--------------------------------------------------------------------------
    | Territory isolation (franchise exclusivity)
    |--------------------------------------------------------------------------
    |
    | When true, matching is confined to a request's Market: only providers
    | assigned to that market are dispatched/see it, and a request outside every
    | Market geofence is blocked (and captured as a coverage lead) instead of
    | fanning out by radius. When false, matching is the legacy radius-only
    | behaviour and market_id is just a label. See MatchingService + RequestService.
    |
    */

    'territory_isolation' => (bool) env('MATCHING_TERRITORY_ISOLATION', true),

];
