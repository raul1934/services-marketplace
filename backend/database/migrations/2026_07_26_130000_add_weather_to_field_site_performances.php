<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Weather at the time of the visit: {type, temp}. The tech picks the type
 * (clear, cloudy, rainy…); the temperature is best-effort from the device.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('field_site_performances', function (Blueprint $table) {
            $table->json('weather')->nullable()->after('time');
        });
    }

    public function down(): void
    {
        Schema::table('field_site_performances', function (Blueprint $table) {
            $table->dropColumn('weather');
        });
    }
};
