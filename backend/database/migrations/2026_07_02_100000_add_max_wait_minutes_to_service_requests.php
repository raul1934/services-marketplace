<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->unsignedSmallInteger('max_wait_minutes')->nullable()->after('urgency');
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn('max_wait_minutes');
        });
    }
};
