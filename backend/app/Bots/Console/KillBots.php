<?php

namespace App\Bots\Console;

use App\Bots\BotGate;
use Illuminate\Console\Command;

/**
 * TEMPORARY — test bots. Runtime stop/start without a deploy or restart.
 *
 * Flipping BOTS_ENABLED needs a container restart and a config:clear; this
 * takes effect on the next gate check. Because every job re-checks the gate
 * inside handle(), it also stops bids that are already sitting in the queue
 * waiting on their delay — which the env var alone would not.
 */
class KillBots extends Command
{
    protected $signature = 'bots:kill {--revive : Resume bot activity instead}';

    protected $description = 'Stop all bot activity immediately, including queued work (TEMPORARY)';

    public function handle(): int
    {
        if ($this->option('revive')) {
            BotGate::revive();
            $this->info('Bots revived.');

            if (! config('bots.enabled')) {
                $this->warn('Note: BOTS_ENABLED is still false, so nothing will run.');
            }

            return self::SUCCESS;
        }

        BotGate::kill();
        $this->info('Bots killed. Queued bot jobs will no-op as they come due.');
        $this->line('Run `php artisan bots:kill --revive` to resume.');

        return self::SUCCESS;
    }
}
