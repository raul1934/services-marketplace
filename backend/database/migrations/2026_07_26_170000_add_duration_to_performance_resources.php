<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Equipment on a service is billed by time. Each equipment records a duration:
 * either a fixed number of minutes (picked in 15-minute steps) or "follow the
 * site" (site_duration = true → uses the visit's own duration).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('field_service_performance_resources', function (Blueprint $table) {
            $table->unsignedSmallInteger('minutes')->nullable()->after('qty');
            $table->boolean('site_duration')->default(false)->after('minutes');
        });
    }

    public function down(): void
    {
        Schema::table('field_service_performance_resources', function (Blueprint $table) {
            $table->dropColumn(['minutes', 'site_duration']);
        });
    }
};
