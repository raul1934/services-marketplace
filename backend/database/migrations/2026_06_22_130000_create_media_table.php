<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Polymorphic media: one table for all user-generated images. Backfills the four
 * previous storage styles (request_photos table, surcharges/dispute JSON arrays,
 * job_updates photo column) and drops them. Avatar/asset cover photos stay as
 * columns (true 1:1) and are out of scope.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('mediable_type')->nullable(); // null while orphan (uploaded, not attached)
            $table->unsignedBigInteger('mediable_id')->nullable();
            $table->foreignId('uploaded_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('disk')->default('public');
            $table->string('path');
            $table->string('tag')->nullable(); // request|before|after|surcharge|dispute|update
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['mediable_type', 'mediable_id']);
            $table->index('mediable_id'); // orphan sweep
        });

        $this->backfill();

        Schema::dropIfExists('request_photos');
        Schema::table('surcharges', fn (Blueprint $t) => $t->dropColumn('photos'));
        Schema::table('dispute_evidence', fn (Blueprint $t) => $t->dropColumn('photos'));
        Schema::table('job_updates', fn (Blueprint $t) => $t->dropColumn(['photo_path', 'disk']));
    }

    private function backfill(): void
    {
        // request_photos → media (phase becomes tag)
        if (Schema::hasTable('request_photos')) {
            DB::table('request_photos')->orderBy('id')->chunk(200, function ($rows) {
                $insert = $rows->map(fn ($r) => [
                    'mediable_type' => \App\Models\ServiceRequest::class,
                    'mediable_id' => $r->service_request_id,
                    'uploaded_by_id' => $r->uploaded_by_id,
                    'disk' => $r->disk ?? 'public',
                    'path' => $r->path,
                    'tag' => $r->phase ?? 'request',
                    'position' => 0,
                    'created_at' => $r->created_at,
                    'updated_at' => $r->updated_at,
                ])->all();
                DB::table('media')->insert($insert);
            });
        }

        // surcharges.photos (JSON array) → media
        DB::table('surcharges')->whereNotNull('photos')->orderBy('id')->chunk(200, function ($rows) {
            foreach ($rows as $s) {
                foreach ((array) json_decode($s->photos ?? '[]', true) as $i => $path) {
                    DB::table('media')->insert([
                        'mediable_type' => \App\Models\Surcharge::class,
                        'mediable_id' => $s->id,
                        'uploaded_by_id' => $s->provider_id,
                        'disk' => 'public', 'path' => $path, 'tag' => 'surcharge', 'position' => $i,
                        'created_at' => $s->created_at, 'updated_at' => $s->updated_at,
                    ]);
                }
            }
        });

        // dispute_evidence.photos (JSON array) → media
        DB::table('dispute_evidence')->whereNotNull('photos')->orderBy('id')->chunk(200, function ($rows) {
            foreach ($rows as $e) {
                foreach ((array) json_decode($e->photos ?? '[]', true) as $i => $path) {
                    DB::table('media')->insert([
                        'mediable_type' => \App\Models\DisputeEvidence::class,
                        'mediable_id' => $e->id,
                        'uploaded_by_id' => null,
                        'disk' => 'public', 'path' => $path, 'tag' => 'dispute', 'position' => $i,
                        'created_at' => $e->created_at, 'updated_at' => $e->updated_at,
                    ]);
                }
            }
        });

        // job_updates.photo_path → media
        DB::table('job_updates')->whereNotNull('photo_path')->orderBy('id')->chunk(200, function ($rows) {
            foreach ($rows as $u) {
                DB::table('media')->insert([
                    'mediable_type' => \App\Models\JobUpdate::class,
                    'mediable_id' => $u->id,
                    'uploaded_by_id' => $u->user_id,
                    'disk' => $u->disk ?? 'public', 'path' => $u->photo_path, 'tag' => 'update', 'position' => 0,
                    'created_at' => $u->created_at, 'updated_at' => $u->updated_at,
                ]);
            }
        });
    }

    public function down(): void
    {
        // Structure only — data is not restored (dev uses migrate:fresh --seed).
        Schema::table('job_updates', function (Blueprint $t) {
            $t->string('disk')->default('public');
            $t->string('photo_path')->nullable();
        });
        Schema::table('dispute_evidence', fn (Blueprint $t) => $t->json('photos')->nullable());
        Schema::table('surcharges', fn (Blueprint $t) => $t->json('photos')->nullable());
        Schema::create('request_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_request_id')->constrained()->cascadeOnDelete();
            $table->string('phase')->default('request');
            $table->foreignId('uploaded_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('disk')->default('public');
            $table->string('path');
            $table->timestamps();
        });

        Schema::dropIfExists('media');
    }
};
