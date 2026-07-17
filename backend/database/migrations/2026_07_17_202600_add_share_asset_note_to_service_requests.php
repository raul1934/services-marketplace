<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Whether the asset's provider_note is shared with the provider on this
        // request. Private by default — the owner opts in per request.
        Schema::table('service_requests', function (Blueprint $table) {
            $table->boolean('share_asset_note')->default(false)->after('asset_id');
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn('share_asset_note');
        });
    }
};
