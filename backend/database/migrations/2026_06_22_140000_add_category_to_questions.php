<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-category intake questions: a question can belong to a specific category
 * (service_category_id set) or stay type-level (null) as a fallback shown for
 * every category of that type.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropUnique(['category_type', 'key']);
            $table->foreignId('service_category_id')->nullable()->after('category_type')
                ->constrained('service_categories')->cascadeOnDelete();
            $table->index(['service_category_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('service_category_id');
            $table->unique(['category_type', 'key']);
        });
    }
};
