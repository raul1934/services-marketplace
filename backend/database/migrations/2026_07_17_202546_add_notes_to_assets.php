<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Two owner-authored notes on any asset:
        //  - private_note: the owner's own reference, never shown to providers.
        //  - provider_note: info the owner may choose to share with a provider.
        Schema::table('assets', function (Blueprint $table) {
            $table->text('private_note')->nullable()->after('photo_path');
            $table->text('provider_note')->nullable()->after('private_note');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['private_note', 'provider_note']);
        });
    }
};
