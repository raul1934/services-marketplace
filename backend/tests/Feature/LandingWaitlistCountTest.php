<?php

namespace Tests\Feature;

use App\Models\WaitlistEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class LandingWaitlistCountTest extends TestCase
{
    use RefreshDatabase;

    private function seedEntries(int $n): void
    {
        $rows = [];
        for ($i = 0; $i < $n; $i++) {
            $rows[] = [
                'role' => 'customer',
                'name' => "Pessoa {$i}",
                'email' => "pessoa{$i}@exemplo.com",
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        WaitlistEntry::insert($rows);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush(); // o endpoint memoiza por um minuto; cada teste começa limpo
    }

    public function test_reports_null_below_the_floor(): void
    {
        config(['landing.waitlist_count_floor' => 100]);
        $this->seedEntries(12);

        $this->getJson('/api/v1/waitlist/count')
            ->assertOk()
            ->assertJsonPath('data.count', null);
    }

    public function test_reports_the_count_once_it_reaches_the_floor(): void
    {
        config(['landing.waitlist_count_floor' => 5]);
        $this->seedEntries(5);

        $this->getJson('/api/v1/waitlist/count')
            ->assertOk()
            ->assertJsonPath('data.count', 5);
    }

    public function test_is_public_and_leaks_no_personal_data(): void
    {
        // O endpoint é aberto e fica no hero: só pode devolver o agregado. Se um
        // dia alguém trocar o count por uma listagem, este teste quebra.
        config(['landing.waitlist_count_floor' => 1]);
        WaitlistEntry::create([
            'role' => 'customer',
            'name' => 'Marina Alves',
            'email' => 'marina@exemplo.com',
            'phone' => '17999999999',
            'city' => 'São José do Rio Preto',
        ]);

        $res = $this->getJson('/api/v1/waitlist/count')->assertOk();

        $res->assertJsonPath('data.count', 1);
        $corpo = $res->getContent();
        foreach (['Marina', 'marina@exemplo.com', '17999999999', 'Rio Preto'] as $vazamento) {
            $this->assertStringNotContainsString($vazamento, $corpo);
        }
    }

    public function test_answer_is_cached_between_requests(): void
    {
        config(['landing.waitlist_count_floor' => 1]);
        $this->seedEntries(3);

        $this->getJson('/api/v1/waitlist/count')->assertJsonPath('data.count', 3);

        // Entrada nova não aparece enquanto o cache do minuto não vence — é o
        // comportamento pretendido, e é o que segura o COUNT fora do caminho
        // quente de cada visita.
        $this->seedEntries(1);
        $this->getJson('/api/v1/waitlist/count')->assertJsonPath('data.count', 3);

        Cache::flush();
        $this->getJson('/api/v1/waitlist/count')->assertJsonPath('data.count', 4);
    }
}
