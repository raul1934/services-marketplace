<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TEMPORARY — test bots. Drop this migration together with app/Bots.
 *
 * Three flags rather than a name convention ("TEST ..."): a boolean is
 * indexable, survives someone renaming an account in Filament, and makes
 * teardown a single `where('is_test', true)->delete()`.
 *
 * is_test is denormalized onto the content instead of derived from
 * users.is_bot so list endpoints (the provider feed, the proposals list)
 * don't need an extra join/eager-load just to render the "test" banner —
 * and so a half-finished purge can't leave unmarked bot rows in a real
 * user's feed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_bot')->default(false)->after('is_admin')->index();
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->boolean('is_test')->default(false)->after('status')->index();
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->boolean('is_test')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_bot']);
            $table->dropColumn('is_bot');
        });

        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropIndex(['is_test']);
            $table->dropColumn('is_test');
        });

        Schema::table('proposals', function (Blueprint $table) {
            $table->dropColumn('is_test');
        });
    }
};
