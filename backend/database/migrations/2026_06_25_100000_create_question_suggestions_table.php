<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Suggested pre-bid questions: a per-category, per-language catalogue of
        // canned questions a provider can fire at the client before bidding. Rows
        // are one-per-language (the `lang` column) so the API can return them
        // already localized. A provider picking one COPIES its text into the
        // request_questions row (snapshot) and keeps a tracking link back here.
        Schema::create('question_suggestions', function (Blueprint $table) {
            $table->id();
            // Matches service_categories.type (e.g. 'roadside'); type-level fallback.
            $table->string('category_type')->index();
            // When set, the suggestion is specific to this exact category; when null
            // it applies to every category of `category_type`. Mirrors the questions
            // intake catalogue pattern.
            $table->foreignId('service_category_id')->nullable()
                ->constrained('service_categories')->cascadeOnDelete();
            // Stable id so the same logical suggestion can be paired across languages
            // and re-seeded idempotently.
            $table->string('key');
            $table->string('lang')->index(); // 'pt' | 'en'
            $table->text('text');
            // Whether answering this question requires the client to attach a photo.
            $table->boolean('image_required')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['category_type', 'service_category_id', 'key', 'lang'], 'question_suggestions_unique');
            $table->index(['service_category_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_suggestions');
    }
};
