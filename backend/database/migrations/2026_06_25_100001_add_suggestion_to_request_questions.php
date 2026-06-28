<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('request_questions', function (Blueprint $table) {
            // Tracking-only link to the suggestion this question was created from
            // (null for free-typed questions). The question text is copied into the
            // `question` column, so the row never depends on the suggestion.
            $table->foreignId('suggestion_id')->nullable()->after('provider_id')
                ->constrained('question_suggestions')->nullOnDelete();
            // Snapshot copied from the suggestion: whether the client's answer must
            // include a photo.
            $table->boolean('image_required')->default(false)->after('answer');
        });
    }

    public function down(): void
    {
        Schema::table('request_questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('suggestion_id');
            $table->dropColumn('image_required');
        });
    }
};
