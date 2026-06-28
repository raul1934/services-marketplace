<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Typed per-type characteristics — the asset points to one of these via a
        // polymorphic `detailable` (replaces the old `attributes` JSON blob).
        Schema::create('asset_vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_make_id')->nullable()->constrained('vehicle_makes')->nullOnDelete();
            $table->foreignId('vehicle_model_id')->nullable()->constrained('vehicle_models')->nullOnDelete();
            $table->string('plate')->nullable();
            $table->string('color')->nullable();
            $table->string('year')->nullable();
            $table->unsignedInteger('current_mileage')->nullable(); // denormalized latest odometer; source of truth is asset_readings
            $table->string('fuel')->nullable();
            $table->string('chassis')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_properties', function (Blueprint $table) {
            $table->id();
            $table->string('kind')->nullable();
            $table->string('unit')->nullable();
            $table->string('size')->nullable();
            $table->string('address')->nullable();
            $table->string('floor')->nullable();
            $table->string('condo')->nullable();
            $table->timestamps();
        });

        Schema::create('asset_pets', function (Blueprint $table) {
            $table->id();
            $table->string('species')->nullable();
            $table->string('breed')->nullable();
            $table->string('size')->nullable();
            $table->string('birthdate')->nullable();
            $table->string('weight')->nullable();
            $table->string('vaccines')->nullable();
            $table->string('microchip')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_pets');
        Schema::dropIfExists('asset_properties');
        Schema::dropIfExists('asset_vehicles');
    }
};
