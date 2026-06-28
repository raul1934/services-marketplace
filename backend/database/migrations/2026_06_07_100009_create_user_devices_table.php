<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('os_type')->nullable(); // android | ios | web
            $table->string('device_no')->nullable();
            $table->string('device_name')->nullable();
            $table->string('os_version')->nullable();
            $table->string('app_version')->nullable();
            // Nullable so invalid/expired tokens can be cleared in place (mirrors lula).
            $table->string('notification_token')->nullable()->index();
            $table->timestamps();

            $table->unique(['user_id', 'device_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_devices');
    }
};
