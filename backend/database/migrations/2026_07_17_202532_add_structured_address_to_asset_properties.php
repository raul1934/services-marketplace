<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Structured Brazilian address (CEP-based). Kept alongside the existing
        // free-text `address` so the old field stays valid while the app fills in
        // the granular parts.
        Schema::table('asset_properties', function (Blueprint $table) {
            $table->string('cep')->nullable()->after('address');
            $table->string('street')->nullable()->after('cep');
            $table->string('number')->nullable()->after('street');
            $table->string('neighborhood')->nullable()->after('number');
            $table->string('city')->nullable()->after('neighborhood');
            $table->string('state', 2)->nullable()->after('city'); // UF
        });
    }

    public function down(): void
    {
        Schema::table('asset_properties', function (Blueprint $table) {
            $table->dropColumn(['cep', 'street', 'number', 'neighborhood', 'city', 'state']);
        });
    }
};
