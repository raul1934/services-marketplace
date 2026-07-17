<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The catalog of parts an asset can be broken into — sala, quarto, telhado,
 * piscina. Suggestions only: `asset_parts.name` stays free text, so nothing
 * here restricts what someone can add.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('part_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            // Display order within a property type's suggestions.
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        // Many-to-many: "Sala" belongs to a casa *and* an apartamento, so a
        // simple FK would mean a duplicate row per property type.
        Schema::create('part_type_property_type', function (Blueprint $table) {
            $table->id();
            $table->foreignId('part_type_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_type_id')->constrained()->cascadeOnDelete();
            // Whether this part comes pre-ticked for this property type — an
            // edícula almost always has a pool; a casa might not. Pre-ticking a
            // part is honest: a part is an empty slot to measure (area stays
            // null → "Sem medição"), not a claim about the place.
            $table->boolean('default_selected')->default(false);
            $table->unique(['part_type_id', 'property_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('part_type_property_type');
        Schema::dropIfExists('part_types');
    }
};
