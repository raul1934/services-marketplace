<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A property has a fixed location (so requests for it can reuse it) and an
        // optional drawn footprint (geofence: a closed polygon, min 4 points).
        Schema::table('asset_properties', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('address');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->json('geofence')->nullable()->after('longitude'); // [{latitude,longitude}, …]
        });
    }

    public function down(): void
    {
        Schema::table('asset_properties', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'geofence']);
        });
    }
};
