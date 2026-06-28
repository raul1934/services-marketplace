<?php

use App\Enums\PaymentMethod;
use App\Enums\RequestStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('service_category_id')->constrained();
            // No FK on accepted_proposal_id to avoid a circular dependency with the proposals table.
            $table->unsignedBigInteger('accepted_proposal_id')->nullable();
            $table->foreignId('accepted_provider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('description');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('address')->nullable();
            $table->decimal('budget_max', 10, 2)->nullable();
            $table->string('payment_method')->default(PaymentMethod::Cash->value);
            $table->string('status')->default(RequestStatus::Open->value);
            $table->string('cancelled_reason')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            // Provider requests the client's approval of the parts/total before
            // finishing; client approves. No extra status — these timestamps gate it.
            $table->timestamp('parts_approval_requested_at')->nullable();
            $table->timestamp('parts_approved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'service_category_id']);
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
