<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Named parts of a property (living room, pool, hallway…), each with an
        // optional AR measurement (area/perimeter). Measurements are captured on
        // the device with ARKit/ARCore and stored here so they consolidate on the
        // asset and feed future service budgets.
        Schema::create('asset_parts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->string('name');
            $table->decimal('area', 10, 3)->nullable();       // m²
            $table->decimal('perimeter', 10, 3)->nullable();  // m
            $table->unsignedInteger('points_count')->nullable();
            $table->timestamp('measured_at')->nullable();
            $table->timestamps();

            $table->index('asset_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_parts');
    }
};
