<?php

use App\Enums\ProposalStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('price', 10, 2);
            $table->unsignedSmallInteger('eta_minutes'); // manual ETA: "chego em X min"
            $table->text('comment')->nullable();
            // Optional upfront deposit the provider requires (reduces no-shows on
            // scheduled jobs). percentage drives amount; both denormalized for display.
            $table->boolean('deposit_required')->default(false);
            $table->unsignedTinyInteger('deposit_percentage')->nullable();
            $table->decimal('deposit_amount', 10, 2)->nullable();
            $table->string('status')->default(ProposalStatus::Pending->value);
            $table->timestamps();

            // One bid per provider per request.
            $table->unique(['service_request_id', 'provider_id']);
            $table->index(['service_request_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposals');
    }
};
