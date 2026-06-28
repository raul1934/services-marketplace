<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A provider's "preferred clients" — they get notified first for these
        // clients' jobs. Toggled from the rate-client screen after a job.
        Schema::create('provider_preferred_clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['provider_id', 'client_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_preferred_clients');
    }
};
