<?php

use App\Enums\WarrantyStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warranty_claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->string('type'); // redo | refund
            $table->string('status')->default(WarrantyStatus::Open->value);
            $table->text('description')->nullable();
            $table->timestamp('deadline_at')->nullable(); // claim window (e.g. completed + 7 days)
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['service_request_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warranty_claims');
    }
};
