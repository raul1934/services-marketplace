<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
            // Direction of the review: the client rating the provider, or the
            // provider rating the client. One review per direction per job.
            $table->string('author_role')->default('client');
            $table->unsignedTinyInteger('rating'); // 1..5 (validated in the request)
            $table->text('comment')->nullable();
            // Quick highlight tags chosen on the rating screen.
            $table->json('tags')->nullable();
            // Optional tip the client adds for the provider (client reviews only).
            $table->decimal('tip_amount', 10, 2)->nullable();
            $table->timestamps();

            $table->unique(['service_request_id', 'author_role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
