<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Start-of-service code (C17/P14): a short code generated when a proposal is
 * accepted. The customer reads it to the provider on arrival; the provider may
 * verify it to start the job. Never exposed to the provider over the API.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->string('start_code', 8)->nullable()->after('entry_code');
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn('start_code');
        });
    }
};
