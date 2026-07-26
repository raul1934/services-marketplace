<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The site's geofence — an ordered ring of {lat,lng} points. Drawn on the site
 * info map with each side's length and the enclosed area. Nullable: a site
 * without one just shows the point.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('field_sites', function (Blueprint $table) {
            $table->json('geofence')->nullable()->after('lng');
        });
    }

    public function down(): void
    {
        Schema::table('field_sites', function (Blueprint $table) {
            $table->dropColumn('geofence');
        });
    }
};
