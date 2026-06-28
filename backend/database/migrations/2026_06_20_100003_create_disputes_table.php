<?php

use App\Enums\DisputeStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('opened_by_id')->constrained('users')->cascadeOnDelete();
            $table->text('claim');
            $table->string('status')->default(DisputeStatus::Open->value);
            $table->text('resolution')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['service_request_id', 'status']);
        });

        Schema::create('dispute_evidence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dispute_id')->constrained()->cascadeOnDelete();
            $table->string('party'); // client | provider
            $table->text('text')->nullable();
            $table->json('photos')->nullable(); // disk paths
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dispute_evidence');
        Schema::dropIfExists('disputes');
    }
};
