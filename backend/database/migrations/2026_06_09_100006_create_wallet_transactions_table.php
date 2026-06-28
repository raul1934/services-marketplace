<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Provider wallet ledger. `credit` = net earnings from a completed job;
        // `payout` = a Pix withdrawal. Balance = sum(credit) − sum(payout).
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
            $table->string('type'); // credit | payout
            $table->decimal('amount', 10, 2);
            $table->string('description')->nullable();
            $table->foreignId('service_request_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('completed'); // completed | pending
            $table->timestamps();

            $table->index(['provider_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
