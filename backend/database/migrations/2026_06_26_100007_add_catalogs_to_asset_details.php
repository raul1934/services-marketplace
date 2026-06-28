<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_properties', function (Blueprint $table) {
            $table->foreignId('property_type_id')->nullable()->after('id')->constrained('property_types')->nullOnDelete();
            $table->dropColumn('kind');
        });

        Schema::table('asset_pets', function (Blueprint $table) {
            $table->foreignId('pet_species_id')->nullable()->after('id')->constrained('pet_species')->nullOnDelete();
            $table->foreignId('pet_breed_id')->nullable()->after('pet_species_id')->constrained('pet_breeds')->nullOnDelete();
            $table->dropColumn(['species', 'breed']);
        });

        Schema::table('vehicle_makes', function (Blueprint $table) {
            $table->string('logo_path')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('asset_properties', function (Blueprint $table) {
            $table->dropConstrainedForeignId('property_type_id');
            $table->string('kind')->nullable();
        });

        Schema::table('asset_pets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pet_species_id');
            $table->dropConstrainedForeignId('pet_breed_id');
            $table->string('species')->nullable();
            $table->string('breed')->nullable();
        });

        Schema::table('vehicle_makes', function (Blueprint $table) {
            $table->dropColumn('logo_path');
        });
    }
};
