<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            // Polymorphic pointer to the typed detail row (asset_vehicles/properties/pets).
            $table->nullableMorphs('detailable');
        });

        Schema::table('assets', function (Blueprint $table) {
            // Replaced by the typed detail tables.
            $table->dropColumn('attributes');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->json('attributes')->nullable();
            $table->dropMorphs('detailable');
        });
    }
};
