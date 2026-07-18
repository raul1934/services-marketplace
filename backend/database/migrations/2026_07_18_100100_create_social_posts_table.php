<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A composed post. The image (if any) attaches via the polymorphic `media`
 * table with tag 'social' — no image column here. `scheduled_at` null means
 * publish immediately (via the "Publicar agora" action); a future value is
 * picked up by the social:publish-due command.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_posts', function (Blueprint $table) {
            $table->id();
            $table->text('caption');
            $table->string('status')->default('draft'); // SocialPostStatus
            $table->timestamp('scheduled_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_posts');
    }
};
