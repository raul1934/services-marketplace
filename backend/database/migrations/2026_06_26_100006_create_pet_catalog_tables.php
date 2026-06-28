<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pet_species', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('pet_breeds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pet_species_id')->constrained('pet_species')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->unique(['pet_species_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pet_breeds');
        Schema::dropIfExists('pet_species');
    }
};
