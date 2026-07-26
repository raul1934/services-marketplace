<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Field resource catalog (#193) — the company-owned Equipment/Consumable model
 * the original field migration deliberately deferred ("gated behind validation").
 *
 * Equipment and Consumable share one structure (the user: "consumível é a mesma
 * coisa que equipamento"), so they live in one `field_resources` table split by
 * `kind`. Each company owns its own categories, and a resource can sit in one or
 * more of them (N:N via `field_resource_category`).
 *
 * Execution side: a service performed on a visit records who did it (`assignee`
 * on field_service_performances) and which resources were used
 * (field_service_performance_resources). This is additive — nothing here changes
 * the existing definition-level `who`/`nest` on field_services yet.
 */
return new class extends Migration
{
    public function up(): void
    {
        // The company that owns the catalogs (was only a `contract` string label).
        Schema::create('field_companies', function (Blueprint $table) {
            $table->string('id')->primary(); // slug, e.g. "nadruz"
            $table->string('name');
            $table->timestamps();
        });

        // Link each site to its company (kept alongside the `contract` label).
        Schema::table('field_sites', function (Blueprint $table) {
            $table->string('company_id')->nullable()->after('contract');
            $table->foreign('company_id')->references('id')->on('field_companies')->nullOnDelete();
        });

        // Company-owned categories, per kind (equipment / consumable).
        Schema::create('field_resource_categories', function (Blueprint $table) {
            $table->string('id')->primary(); // slug, e.g. "nadruz:cat:eletrica"
            $table->string('company_id');
            $table->string('kind'); // 'equipment' | 'consumable'
            $table->string('name');
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('field_companies')->cascadeOnDelete();
            $table->index(['company_id', 'kind']);
        });

        // The catalog items themselves.
        Schema::create('field_resources', function (Blueprint $table) {
            $table->string('id')->primary(); // slug, e.g. "nadruz:eq:multimetro"
            $table->string('company_id');
            $table->string('kind');          // 'equipment' | 'consumable'
            $table->string('name');
            $table->string('rate')->nullable(); // equipment: 'visit' | 'hour'
            $table->string('cost')->nullable(); // consumable: 'free' | 'charged'
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->foreign('company_id')->references('id')->on('field_companies')->cascadeOnDelete();
            $table->index(['company_id', 'kind']);
        });

        // N:N — a resource belongs to one or more of its company's categories.
        Schema::create('field_resource_category', function (Blueprint $table) {
            $table->string('resource_id');
            $table->string('category_id');
            $table->primary(['resource_id', 'category_id']);

            $table->foreign('resource_id')->references('id')->on('field_resources')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('field_resource_categories')->cascadeOnDelete();
        });

        // Execution: who performed the service on this visit.
        Schema::table('field_service_performances', function (Blueprint $table) {
            $table->string('assignee')->nullable()->after('service_id');      // initials
            $table->string('assignee_name')->nullable()->after('assignee');
        });

        // Execution: which resources were used on a performed service (any number).
        Schema::create('field_service_performance_resources', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('service_performance_id');
            $table->string('resource_id');
            $table->unsignedSmallInteger('qty')->default(1);
            $table->timestamps();

            $table->foreign('service_performance_id')->references('id')->on('field_service_performances')->cascadeOnDelete();
            $table->foreign('resource_id')->references('id')->on('field_resources')->cascadeOnDelete();
            $table->unique(['service_performance_id', 'resource_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('field_service_performance_resources');
        Schema::table('field_service_performances', function (Blueprint $table) {
            $table->dropColumn(['assignee', 'assignee_name']);
        });
        Schema::dropIfExists('field_resource_category');
        Schema::dropIfExists('field_resources');
        Schema::dropIfExists('field_resource_categories');
        Schema::table('field_sites', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
        });
        Schema::dropIfExists('field_companies');
    }
};
