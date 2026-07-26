<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A service can declare required resources — the equipment and/or consumable it
 * needs. These are catalog items (FieldResource) from the site's company, linked
 * N:N. Shown on the service card in place of the billing rate.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('field_service_required_resources', function (Blueprint $table) {
            $table->string('service_id');
            $table->string('resource_id');
            $table->primary(['service_id', 'resource_id']);

            $table->foreign('service_id')->references('id')->on('field_services')->cascadeOnDelete();
            $table->foreign('resource_id')->references('id')->on('field_resources')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('field_service_required_resources');
    }
};
