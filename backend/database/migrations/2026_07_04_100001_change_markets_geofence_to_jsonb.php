<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Postgres's `json` type has no equality operator, so any query needing
 * DISTINCT/GROUP BY across the whole row breaks on it — hit in practice via
 * Filament's Select::make('markets')->relationship(...)->multiple(), which
 * runs a `select distinct markets.*` to populate options. `jsonb` supports
 * equality (and is the generally-recommended type anyway), so switch to it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE markets ALTER COLUMN geofence TYPE jsonb USING geofence::jsonb');
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE markets ALTER COLUMN geofence TYPE json USING geofence::json');
        }
    }
};
