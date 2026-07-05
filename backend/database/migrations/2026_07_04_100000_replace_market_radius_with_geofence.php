<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('markets', function (Blueprint $table) {
            $table->json('geofence')->nullable()->after('name');
            $table->dropColumn(['center_lat', 'center_lng', 'radius_km']);
        });
    }

    public function down(): void
    {
        Schema::table('markets', function (Blueprint $table) {
            $table->dropColumn('geofence');
            $table->float('center_lat')->default(0);
            $table->float('center_lng')->default(0);
            $table->integer('radius_km')->default(30);
        });
    }
};
