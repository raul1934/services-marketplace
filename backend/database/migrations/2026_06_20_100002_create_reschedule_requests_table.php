<?php

use App\Enums\RescheduleStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reschedule_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('requested_by_id')->constrained('users')->cascadeOnDelete();
            $table->string('requested_by_role'); // client | provider
            $table->timestamp('proposed_starts_at')->nullable();
            $table->timestamp('proposed_ends_at')->nullable();
            $table->string('proposed_reception_type')->nullable(); // on_site | workshop (inversion)
            $table->text('reason')->nullable();
            $table->string('status')->default(RescheduleStatus::Pending->value);
            $table->boolean('late')->default(false); // <24h antecedence → no-show-grade
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['service_request_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reschedule_requests');
    }
};
