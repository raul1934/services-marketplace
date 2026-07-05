<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sweep uploads that were never attached to a record.
Schedule::command('media:prune-orphans')->hourly();

// Expire urgent requests nobody bid on within the client's stated max wait.
Schedule::command('requests:expire-stale')->everyMinute();
