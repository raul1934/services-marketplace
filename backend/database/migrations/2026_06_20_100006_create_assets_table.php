<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type'); // vehicle | property | pet
            $table->string('nickname'); // free nickname: "Civic do pai", "Apê 502"
            $table->json('attributes')->nullable(); // type-specific: make/model/plate/year…
            $table->string('photo_path')->nullable();
            $table->timestamp('archived_at')->nullable(); // sold/given away — history kept
            $table->timestamps();

            $table->index(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
