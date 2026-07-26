<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Before/after photos of a site visit, stored on the SitePerformance as
 * {url, at} (upload-first: the file goes to POST /uploads, its url is attached
 * here). Two phases keep it simple for the prototype.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('field_site_performances', function (Blueprint $table) {
            $table->json('photo_before')->nullable()->after('time');
            $table->json('photo_after')->nullable()->after('photo_before');
        });
    }

    public function down(): void
    {
        Schema::table('field_site_performances', function (Blueprint $table) {
            $table->dropColumn(['photo_before', 'photo_after']);
        });
    }
};
