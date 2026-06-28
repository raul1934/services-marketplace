<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Early-access leads captured by the marketing landing page.
        Schema::create('waitlist_entries', function (Blueprint $table) {
            $table->id();
            $table->string('role')->default('customer'); // 'customer' | 'pro'
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('city')->nullable();
            $table->string('service')->nullable();
            $table->timestamps();

            $table->index('email');
            $table->index(['role', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waitlist_entries');
    }
};
