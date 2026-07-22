<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Sweep uploads that were never attached to a record.
Schedule::command('media:prune-orphans')->hourly();

// Alert ops about open requests nobody has bid on yet — while there is still
// time to rescue them by hand. Runs before expire-stale on purpose: once that
// one fires, the client has already given up.
Schedule::command('requests:detect-uncovered')->everyMinute()->withoutOverlapping();

// Expire urgent requests nobody bid on within the client's stated max wait.
Schedule::command('requests:expire-stale')->everyMinute();

// Publish scheduled social posts once their time arrives.
Schedule::command('social:publish-due')->everyMinute();

// Keep like/comment counts + comment text current for published social posts.
Schedule::command('social:refresh-interactions')->everyTenMinutes();

// TEMP — test bots. Both commands no-op unless BOTS_ENABLED is on, so leaving
// them scheduled while the bots are off is free. Remove with app/Bots.
// withoutOverlapping() because they write rows: a stalled run must not double-post.
Schedule::command('bots:create-request')->everyTwoMinutes()->withoutOverlapping();
Schedule::command('bots:advance')->everyMinute()->withoutOverlapping();
