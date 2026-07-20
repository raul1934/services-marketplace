<?php

namespace App\Bots\Console;

use App\Models\Proposal;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * TEMPORARY — test bots. Removes every trace of the bots, so the feature can be
 * deleted from the codebase afterwards without leaving orphan data behind.
 *
 * Destructive, so it confirms first unless --force is passed.
 */
class PurgeBots extends Command
{
    protected $signature = 'bots:purge {--force : Skip the confirmation prompt}';

    protected $description = 'Delete all bot accounts and bot-generated data (TEMPORARY, DESTRUCTIVE)';

    public function handle(): int
    {
        $botIds = User::where('is_bot', true)->pluck('id');
        $requests = ServiceRequest::where('is_test', true)->count();
        $proposals = Proposal::where('is_test', true)->count();

        $this->warn('This will permanently delete:');
        $this->line("  {$botIds->count()} bot account(s)");
        $this->line("  {$requests} test request(s) (and everything cascading off them)");
        $this->line("  {$proposals} test proposal(s)");

        if (! $this->option('force') && ! $this->confirm('Proceed?', false)) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($botIds) {
            // Wallet credits earned by real providers on bot jobs. settleEarnings
            // already skips test jobs, so this only catches rows from before that
            // guard existed — cheap insurance rather than a load-bearing step.
            WalletTransaction::whereIn(
                'service_request_id',
                ServiceRequest::where('is_test', true)->select('id')
            )->delete();

            // Proposals by bots on real customers' requests: those requests are
            // NOT test rows and must survive, so delete the bids explicitly
            // before the accounts go.
            Proposal::where('is_test', true)->orWhereIn('provider_id', $botIds)->delete();

            // Requests cascade their own children (proposals, questions, media,
            // availabilities) via the FK constraints.
            ServiceRequest::where('is_test', true)->delete();

            User::whereIn('id', $botIds)->delete();
        });

        $this->info('Purged.');
        $this->newLine();
        $this->line('Now safe to remove: app/Bots, config/bots.php, the bot migration,');
        $this->line('the withCommands() line in bootstrap/app.php, the observer block in');
        $this->line('AppServiceProvider, the two Schedule lines in routes/console.php,');
        $this->line('the is_test fields in the API resources, and the frontend TestBanner.');

        return self::SUCCESS;
    }
}
