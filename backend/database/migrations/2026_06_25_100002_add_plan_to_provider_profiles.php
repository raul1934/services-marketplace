<?php

use App\Enums\ProviderPlan;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provider_profiles', function (Blueprint $table) {
            // Subscription plan; drives the per-job commission rate.
            $table->string('plan')->default(ProviderPlan::Free->value)->after('is_approved');
        });
    }

    public function down(): void
    {
        Schema::table('provider_profiles', function (Blueprint $table) {
            $table->dropColumn('plan');
        });
    }
};
