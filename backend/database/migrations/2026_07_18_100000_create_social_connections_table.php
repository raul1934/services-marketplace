<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A connected social account the super admin can publish to. The long-lived
 * access token is stored encrypted (see SocialConnection's `encrypted` cast) —
 * it is pasted in by the super admin, never in env. `external_id` is the
 * Facebook Page id or the Instagram user id, depending on `provider`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_connections', function (Blueprint $table) {
            $table->id();
            $table->string('provider'); // SocialProvider: facebook|instagram
            $table->string('external_id'); // FB Page id / IG user id
            $table->string('name');
            $table->text('access_token'); // encrypted at rest (model cast)
            $table->timestamp('token_expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['provider', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_connections');
    }
};
