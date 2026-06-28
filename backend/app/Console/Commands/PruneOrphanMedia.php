<?php

namespace App\Console\Commands;

use App\Models\Media;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/** Deletes media that were uploaded but never attached to a record. */
class PruneOrphanMedia extends Command
{
    protected $signature = 'media:prune-orphans {--hours=24 : Age threshold in hours}';

    protected $description = 'Delete orphan media (no owner) older than the threshold, with their files';

    public function handle(): int
    {
        $cutoff = now()->subHours((int) $this->option('hours'));
        $count = 0;

        Media::whereNull('mediable_id')
            ->where('created_at', '<', $cutoff)
            ->chunkById(200, function ($rows) use (&$count) {
                foreach ($rows as $m) {
                    Storage::disk($m->disk ?? 'public')->delete($m->path);
                    $m->delete();
                    $count++;
                }
            });

        $this->info("Pruned {$count} orphan media.");

        return self::SUCCESS;
    }
}
