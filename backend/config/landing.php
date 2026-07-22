<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Waitlist counter floor
    |--------------------------------------------------------------------------
    |
    | Below this many sign-ups, GET /api/v1/waitlist/count reports null and the
    | landing hides the counter instead of showing the number.
    |
    | A counter is social proof only while the number argues FOR joining. "1.847
    | pessoas na lista" pulls; "27 pessoas na lista" pushes away — it tells the
    | reader nobody else showed up. The floor is where the number stops being
    | evidence of momentum and starts being evidence against it.
    |
    | This exists because the hero used to claim "12k+ atendimentos" for a
    | product that had not served anyone. The counter is the honest replacement,
    | and staying quiet while it is small is part of being honest.
    |
    */

    'waitlist_count_floor' => env('LANDING_WAITLIST_COUNT_FLOOR', 100),

];
