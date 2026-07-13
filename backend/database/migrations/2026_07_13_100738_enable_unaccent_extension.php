<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Accent-insensitive search for city names (e.g. "goiania" -> "Goiânia",
 * "sao paulo" -> "São Paulo"). Used by LandingController@cities.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS unaccent');
    }

    public function down(): void
    {
        // Leave the extension in place — other queries may rely on it.
    }
};
