<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Unmet demand: a request a customer tried to open outside every Market's
 * geofence (no franchisee covers it yet). Captured so expansion can be
 * prioritised by where people are actually asking for service.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coverage_leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('service_category_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('address')->nullable();
            $table->timestamps();

            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coverage_leads');
    }
};
