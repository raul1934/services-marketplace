<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cached road geometry (OSRM) for a route's polyline. The stops are a fixed
 * template, so the road path is stable — computed once on first view and stored
 * as [{latitude,longitude}] to avoid hitting OSRM on every load.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('field_routes', function (Blueprint $table) {
            $table->json('geometry')->nullable()->after('km');
        });
    }

    public function down(): void
    {
        Schema::table('field_routes', function (Blueprint $table) {
            $table->dropColumn('geometry');
        });
    }
};
