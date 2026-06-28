<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('is_online')->default(false);
            $table->string('company_name')->nullable();
            $table->text('bio')->nullable();
            // Vehicle used for roadside jobs (shown on the tracking screen).
            $table->string('vehicle_type')->nullable();
            // Onboarding / verification.
            $table->boolean('is_approved')->default(false);
            $table->unsignedSmallInteger('coverage_radius_km')->default(30);
            $table->date('insurance_valid_until')->nullable();
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedInteger('jobs_completed')->default(0);
            $table->timestamp('last_online_at')->nullable();
            $table->timestamps();
        });

        // Provider verification documents (ID, license, insurance, vehicle…).
        Schema::create('provider_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // id | license | insurance | vehicle | other
            $table->string('disk')->default('public');
            $table->string('path')->nullable();
            $table->string('status')->default('pending'); // pending | uploaded | approved | rejected
            $table->timestamps();

            $table->unique(['user_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_documents');
        Schema::dropIfExists('provider_profiles');
    }
};
