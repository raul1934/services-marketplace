<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Catalog of intake questions shown when creating a request. Defined per
        // category type (e.g. roadside asks for vehicle details). Seeded; the
        // answers a client gives are stored in request_answers.
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->string('category_type')->index(); // matches service_categories.type
            $table->string('key');                     // stable id, e.g. 'make_model'
            $table->json('text');                      // { "pt": "...", "en": "..." }
            $table->string('type')->default('text');   // text | number | select
            $table->json('placeholder')->nullable();   // { "pt": "...", "en": "..." }
            $table->json('options')->nullable();        // [{ value, text:{pt,en} }] for select
            $table->boolean('half')->default(false);   // two-per-row layout hint
            $table->boolean('required')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['category_type', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
