<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Comments pulled back from the platform for a published target. Upserted by
 * PollSocialInteractions keyed on (target, external_id) so re-polling doesn't
 * duplicate.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('social_post_target_id')->constrained()->cascadeOnDelete();
            $table->string('external_id');
            $table->string('author_name')->nullable();
            $table->text('text')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();

            $table->unique(['social_post_target_id', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_comments');
    }
};
