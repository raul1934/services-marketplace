<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per (post, platform): the fan-out of a single composed post to each
 * selected connection. Holds the platform's own post id / permalink, publish
 * status + error, and the polled interaction metrics.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_post_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('social_post_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // SocialProvider, denormalized for querying
            $table->foreignId('social_connection_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending'); // SocialTargetStatus
            $table->string('external_id')->nullable(); // FB/IG post id
            $table->string('permalink')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);
            $table->timestamp('metrics_refreshed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_post_targets');
    }
};
