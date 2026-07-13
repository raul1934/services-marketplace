<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('state_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('ibge_id')->nullable()->unique();
            $table->timestamps();

            $table->index('name');
            $table->index(['state_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};
