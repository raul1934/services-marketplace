<?php

namespace Tests\Feature;

use App\Models\WaitlistEntry;
use Illuminate\Cache\RateLimiter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Indicação da lista de espera (#137).
 *
 * O crédito prometido é dinheiro real que a empresa vai dever quando a praça
 * abrir, então o que importa aqui é o registro ser fiel: quem indicou quem, sem
 * autoindicação, e sem inventar vínculo quando o código não existe.
 */
class WaitlistReferralTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        app(RateLimiter::class)->clear('');
    }

    private function inscrever(array $extra = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/v1/waitlist', array_merge([
            'name' => 'Marina Alves', 'email' => 'marina'.uniqid().'@exemplo.com',
            'city' => 'São José do Rio Preto',
        ], $extra));
    }

    public function test_every_entry_gets_a_code_and_it_comes_back(): void
    {
        $res = $this->inscrever()->assertCreated();

        $codigo = $res->json('data.referral_code');
        $this->assertNotEmpty($codigo);
        $this->assertSame($codigo, WaitlistEntry::first()->referral_code);
    }

    public function test_the_code_avoids_characters_that_get_confused_out_loud(): void
    {
        // O código é ditado em conversa de WhatsApp, não só clicado. Trocar
        // "zero" por "ó" custa a indicação inteira.
        for ($i = 0; $i < 30; $i++) {
            $codigo = WaitlistEntry::gerarCodigo();
            $this->assertDoesNotMatchRegularExpression('/[01OIL5S]/', $codigo, "gerou {$codigo}");
        }
    }

    public function test_signing_up_with_a_code_records_who_referred(): void
    {
        $indicador = WaitlistEntry::create([
            'name' => 'Quem indicou', 'email' => 'indicador@exemplo.com', 'locale' => 'pt',
        ]);

        $this->inscrever(['referral_code' => $indicador->referral_code])->assertCreated();

        $novo = WaitlistEntry::where('email', '!=', 'indicador@exemplo.com')->first();
        $this->assertSame($indicador->id, $novo->referred_by_id);
        $this->assertTrue($indicador->indicados()->whereKey($novo->id)->exists());
    }

    public function test_the_code_is_case_insensitive(): void
    {
        // Vem de link colado, de mensagem encaminhada, de gente digitando à mão.
        $indicador = WaitlistEntry::create([
            'name' => 'Quem indicou', 'email' => 'indicador@exemplo.com', 'locale' => 'pt',
        ]);

        $this->inscrever([
            'referral_code' => strtolower($indicador->referral_code),
        ])->assertCreated();

        $novo = WaitlistEntry::where('email', '!=', 'indicador@exemplo.com')->first();
        $this->assertSame($indicador->id, $novo->referred_by_id);
    }

    public function test_an_unknown_code_does_not_block_the_signup(): void
    {
        // Recusar o cadastro por causa de um código torto perderia o lead para
        // proteger um crédito — a troca errada.
        $this->inscrever(['referral_code' => 'NAOEXISTE'])->assertCreated();

        $this->assertNull(WaitlistEntry::first()->referred_by_id);
    }

    public function test_you_cannot_refer_yourself(): void
    {
        // O jeito mais óbvio de fabricar crédito.
        $eu = WaitlistEntry::create([
            'name' => 'Marina', 'email' => 'marina@exemplo.com', 'locale' => 'pt',
        ]);

        $this->inscrever([
            'email' => 'MARINA@exemplo.com',
            'referral_code' => $eu->referral_code,
        ])->assertCreated();

        $segundo = WaitlistEntry::where('id', '!=', $eu->id)->first();
        $this->assertNull($segundo->referred_by_id);
    }

    public function test_deleting_the_referrer_keeps_the_referred(): void
    {
        // Se quem indicou pedir exclusão dos dados, quem foi indicado não pode
        // sumir junto: ele não tem nada a ver com aquilo, e o crédito dele
        // continua devido.
        $indicador = WaitlistEntry::create([
            'name' => 'Quem indicou', 'email' => 'indicador@exemplo.com', 'locale' => 'pt',
        ]);
        $this->inscrever(['referral_code' => $indicador->referral_code])->assertCreated();
        $indicado = WaitlistEntry::where('email', '!=', 'indicador@exemplo.com')->first();

        $indicador->delete();

        $this->assertTrue(WaitlistEntry::whereKey($indicado->id)->exists());
        $this->assertNull($indicado->refresh()->referred_by_id);
    }

    public function test_credit_starts_pending(): void
    {
        // A coluna é a lista do que ainda devemos quando a praça abrir.
        $indicador = WaitlistEntry::create([
            'name' => 'Quem indicou', 'email' => 'indicador@exemplo.com', 'locale' => 'pt',
        ]);
        $this->inscrever(['referral_code' => $indicador->referral_code])->assertCreated();

        $indicado = WaitlistEntry::where('email', '!=', 'indicador@exemplo.com')->first();
        $this->assertNull($indicado->referral_credit_granted_at);
    }
}
