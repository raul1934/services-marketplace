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

];
