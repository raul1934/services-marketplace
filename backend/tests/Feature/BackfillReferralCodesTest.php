<?php

namespace Tests\Feature;

use App\Models\WaitlistEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BackfillReferralCodesTest extends TestCase
{
    use RefreshDatabase;

    public function test_fills_entries_that_predate_the_feature(): void
    {
        // Inserção direta para simular o registro antigo: passando pelo modelo,
        // o `creating` geraria o código e não haveria o que preencher.
        DB::table('waitlist_entries')->insert([
            'role' => 'customer', 'name' => 'Lead Antigo', 'email' => 'antigo@exemplo.com',
            'locale' => 'pt', 'referral_code' => null,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->executarMigration();

        $this->assertNotNull(WaitlistEntry::where('email', 'antigo@exemplo.com')->value('referral_code'));
    }

    public function test_never_rewrites_an_existing_code(): void
    {
        // Código trocado quebra link já compartilhado.
        $e = WaitlistEntry::create([
            'name' => 'Já tem', 'email' => 'temcodigo@exemplo.com', 'locale' => 'pt',
        ]);
        $antes = $e->referral_code;

        $this->executarMigration();
        $this->executarMigration();

        $this->assertSame($antes, $e->refresh()->referral_code);
    }

    private function executarMigration(): void
    {
        (require base_path('database/migrations/2026_07_22_150000_backfill_referral_codes.php'))->up();
    }
}
