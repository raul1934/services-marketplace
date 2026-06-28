<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Append-only odometer log: recording a reading (by the owner or by the
        // servicing provider) keeps the full history; `asset_vehicles.current_mileage`
        // is a denormalized cache of the latest value.
        Schema::create('asset_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('service_request_id')->nullable()->constrained('service_requests')->nullOnDelete();
            $table->unsignedInteger('mileage');
            $table->timestamp('recorded_at');
            $table->string('note')->nullable();
            $table->foreignId('recorded_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source'); // customer | provider
            $table->timestamps();

            $table->index(['asset_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_readings');
    }
};
