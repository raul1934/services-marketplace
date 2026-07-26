<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Field-service module (B2B prototype). Two layers, kept strictly apart:
 *
 *  • Definitions (master data, shift-independent): Site, Service, Route,
 *    RouteStop, CatalogItem. A route/site is a reusable template — it has NO
 *    execution status of its own.
 *
 *  • Execution (tied to a shift): the Shift is the operational root. A tech
 *    opens a shift; crew members each get their own shift row pointing back to
 *    the leader's (shift_leader_id). Running a route is a RoutePerformance; a
 *    visit is a SitePerformance; each service done on that visit is a
 *    ServicePerformance. A stop's now/next/done + "Nx this shift", and a
 *    route/site "running" state, are DERIVED from these — never stored on the
 *    definition.
 *
 * Deliberately thin (service line-items live in a JSON `nest`); the full B2B
 * domain (Company/Contract/Equipment/Consumable/Measurement) is gated behind
 * validation — see docs/estrategia-b2b.md. String ids match the app's slugs.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Definitions (master data) ────────────────────────────────────
        Schema::create('field_sites', function (Blueprint $table) {
            $table->string('id')->primary(); // slug, e.g. "rio-fortore"
            $table->string('name');
            $table->string('contract');      // administradora / contract label
            $table->string('address');
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->timestamps();
        });

        Schema::create('field_services', function (Blueprint $table) {
            $table->string('id')->primary(); // "{site}:{service}"
            $table->string('site_id');
            $table->string('name');
            $table->string('who');           // initials of the usual responsible tech
            $table->string('who_name');
            $table->string('rate');          // 'visit' | 'hour'
            $table->boolean('obrig')->default(false); // mandatory on every visit
            // Nested line-items (equipment / material / checklist): [{icon,label,sub,value,tone?}].
            $table->json('nest')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->foreign('site_id')->references('id')->on('field_sites')->cascadeOnDelete();
        });

        Schema::create('field_routes', function (Blueprint $table) {
            $table->string('id')->primary(); // slug, e.g. "centro-norte"
            $table->string('name');
            $table->decimal('km', 6, 1)->default(0);
            $table->timestamps();
        });

        Schema::create('field_route_stops', function (Blueprint $table) {
            $table->id();
            $table->string('route_id');
            $table->string('site_id');
            $table->string('km');            // display label like "1,2"
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->foreign('route_id')->references('id')->on('field_routes')->cascadeOnDelete();
            $table->foreign('site_id')->references('id')->on('field_sites')->cascadeOnDelete();
        });

        Schema::create('field_catalog_items', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('rate');          // 'visit' | 'hour'
            $table->boolean('obrig')->default(false);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        // ── Execution (tied to a shift) ──────────────────────────────────
        Schema::create('field_shifts', function (Blueprint $table) {
            $table->string('id')->primary();
            // Who opened the shift. Equal to this row's own id → master shift.
            // Points to another shift's id → this is a crew member of that shift.
            // Left as a plain indexed column (no DB FK): a master row references
            // itself, which a self-referencing constraint can't satisfy on insert.
            $table->string('shift_leader_id')->nullable()->index();
            $table->string('tech');          // crew / tech label
            $table->date('date');
            $table->string('status')->default('scheduled'); // 'scheduled' | 'active' | 'done'
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });

        Schema::create('field_route_performances', function (Blueprint $table) {
            $table->id();
            $table->string('shift_id');
            $table->string('route_id');
            $table->string('status')->default('running'); // 'running' | 'done'
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->foreign('shift_id')->references('id')->on('field_shifts')->cascadeOnDelete();
            $table->foreign('route_id')->references('id')->on('field_routes')->cascadeOnDelete();
        });

        Schema::create('field_site_performances', function (Blueprint $table) {
            $table->id();
            $table->string('shift_id');
            $table->unsignedBigInteger('route_performance_id')->nullable(); // the route being run
            $table->string('site_id');
            $table->string('status')->default('running'); // 'running' | 'done'
            $table->unsignedSmallInteger('crew')->default(1);
            $table->string('time')->nullable(); // display label, e.g. "8:33"
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->foreign('shift_id')->references('id')->on('field_shifts')->cascadeOnDelete();
            $table->foreign('route_performance_id')->references('id')->on('field_route_performances')->nullOnDelete();
            $table->foreign('site_id')->references('id')->on('field_sites')->cascadeOnDelete();
        });

        Schema::create('field_service_performances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('site_performance_id');
            $table->string('service_id');
            $table->boolean('done')->default(false);
            $table->timestamps();

            $table->foreign('site_performance_id')->references('id')->on('field_site_performances')->cascadeOnDelete();
            $table->foreign('service_id')->references('id')->on('field_services')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('field_service_performances');
        Schema::dropIfExists('field_site_performances');
        Schema::dropIfExists('field_route_performances');
        Schema::dropIfExists('field_shifts');
        Schema::dropIfExists('field_catalog_items');
        Schema::dropIfExists('field_route_stops');
        Schema::dropIfExists('field_routes');
        Schema::dropIfExists('field_services');
        Schema::dropIfExists('field_sites');
    }
};
