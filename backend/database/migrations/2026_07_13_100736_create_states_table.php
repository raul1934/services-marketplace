<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('country_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->char('uf', 2);                        // SP, RJ, ...
            $table->unsignedInteger('ibge_id')->nullable()->unique();
            $table->timestamps();

            $table->unique(['country_id', 'uf']);
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('states');
    }
};
