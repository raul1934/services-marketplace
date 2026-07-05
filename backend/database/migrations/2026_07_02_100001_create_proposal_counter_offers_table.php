<?php

use App\Enums\CounterOfferStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proposal_counter_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->decimal('price', 10, 2);
            $table->string('message')->nullable();
            $table->string('status')->default(CounterOfferStatus::Pending->value);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['proposal_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proposal_counter_offers');
    }
};
