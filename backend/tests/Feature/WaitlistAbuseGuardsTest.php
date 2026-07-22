<?php

namespace Tests\Feature;

use App\Models\WaitlistEntry;
use Illuminate\Cache\RateLimiter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Proteções do cadastro público da lista de espera.
 *
 * A base de waitlist é o que decide qual praça abrir primeiro. Envenená-la com
 * cadastro em massa não derruba nada — só faz a decisão de negócio ser tomada
 * em cima de dado inventado, que é pior, porque não parece um problema.
 */
class WaitlistAbuseGuardsTest extends TestCase
{
    use RefreshDatabase;

    private function payload(int $i = 0): array
    {
        return [
            'role' => 'customer',
            'name' => "Pessoa {$i}",
            'email' => "pessoa{$i}@exemplo.com",
            'city' => 'São José do Rio Preto',
        ];
    }

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        app(RateLimiter::class)->clear('');
    }

    public function test_allows_a_normal_signup(): void
    {
        $this->postJson('/api/v1/waitlist', $this->payload())->assertCreated();
    }

    public function test_blocks_after_five_signups_from_the_same_ip(): void
    {
        // Cinco por minuto é folgado para gente e apertado para script: ninguém
        // preenche o formulário cinco vezes em um minuto.
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/waitlist', $this->payload($i))->assertCreated();
        }

        $this->postJson('/api/v1/waitlist', $this->payload(99))
            ->assertStatus(429);

        $this->assertSame(5, WaitlistEntry::count());
    }

    public function test_the_count_endpoint_is_not_rate_limited(): void
    {
        // Ele fica no hero de toda visita — limitar ali seria esconder a prova
        // social justamente de quem está com a página aberta.
        for ($i = 0; $i < 8; $i++) {
            $this->getJson('/api/v1/waitlist/count')->assertOk();
        }
    }

    public function test_cors_is_open_when_unconfigured(): void
    {
        // Padrão de desenvolvimento: sem CORS_ALLOWED_ORIGINS, tudo passa. É o
        // que evita quebra silenciosa em quem sobe sem ler o .env.example.
        config(['cors.allowed_origins' => ['*']]);

        $this->call('OPTIONS', '/api/v1/waitlist', [], [], [], [
            'HTTP_ORIGIN' => 'https://qualquer-site.com',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ])->assertHeader('Access-Control-Allow-Origin', '*');
    }

    public function test_cors_rejects_a_foreign_origin_when_configured(): void
    {
        config(['cors.allowed_origins' => ['https://chamafacil.app']]);

        $permitida = $this->call('OPTIONS', '/api/v1/waitlist', [], [], [], [
            'HTTP_ORIGIN' => 'https://chamafacil.app',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);
        $permitida->assertHeader('Access-Control-Allow-Origin', 'https://chamafacil.app');

        $estranha = $this->call('OPTIONS', '/api/v1/waitlist', [], [], [], [
            'HTTP_ORIGIN' => 'https://site-de-terceiro.com',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ]);

        // O middleware não omite o cabeçalho para origem estranha — ele devolve a
        // origem CONFIGURADA. Quem barra é o navegador, comparando o valor com a
        // origem da própria requisição: como não bate, a resposta é recusada do
        // outro lado.
        //
        // Então o que importa afirmar não é a ausência do cabeçalho, e sim que
        // ele nunca ecoa a origem estranha nem libera geral. A primeira versão
        // deste teste afirmava ausência e falhava — medindo o mecanismo que eu
        // supus, não a propriedade que protege.
        $devolvido = $estranha->headers->get('Access-Control-Allow-Origin');
        $this->assertNotSame('https://site-de-terceiro.com', $devolvido);
        $this->assertNotSame('*', $devolvido);
    }
}
