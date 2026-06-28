<?php

use App\Enums\SurchargeStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surcharges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->text('reason');
            // Accumulated % over the original combinado (drives the approval tier).
            $table->decimal('percent_accumulated', 5, 2)->default(0);
            $table->string('tier'); // simple | reinforced | requote
            $table->string('status')->default(SurchargeStatus::Pending->value);
            $table->json('photos')->nullable(); // disk paths; reason photo mandatory
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['service_request_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surcharges');
    }
};
