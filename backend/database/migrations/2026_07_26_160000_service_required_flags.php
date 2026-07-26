<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Required equipment/consumable" on a service is just a flag (a message), not a
 * specific catalog item. Replace the pivot with two booleans on the service.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('field_services', function (Blueprint $table) {
            $table->boolean('req_equipment')->default(false)->after('obrig');
            $table->boolean('req_consumable')->default(false)->after('req_equipment');
        });

        Schema::dropIfExists('field_service_required_resources');
    }

    public function down(): void
    {
        Schema::table('field_services', function (Blueprint $table) {
            $table->dropColumn(['req_equipment', 'req_consumable']);
        });

        Schema::create('field_service_required_resources', function (Blueprint $table) {
            $table->string('service_id');
            $table->string('resource_id');
            $table->primary(['service_id', 'resource_id']);
        });
    }
};
