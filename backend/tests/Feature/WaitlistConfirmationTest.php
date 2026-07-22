<?php

namespace Tests\Feature;

use App\Jobs\SendWaitlistConfirmation;
use App\Mail\WaitlistConfirmation;
use App\Models\WaitlistEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class WaitlistConfirmationTest extends TestCase
{
    use RefreshDatabase;

    private array $payload = [
        'role' => 'customer',
        'name' => 'Marina Alves Souza',
        'email' => 'marina@exemplo.com',
        'city' => 'São José do Rio Preto',
    ];

    public function test_joining_the_list_sends_the_confirmation(): void
    {
        // Em teste a fila é `sync` (phpunit.xml), então o job despachado pelo
        // cadastro roda inline e o efeito já aconteceu quando o POST retorna.
        // Quem marca `confirmed_mail_sent_at` é o job, depois de reivindicar —
        // marcar no despacho era o bug que a #168 corrigiu.
        Mail::fake();

        $this->postJson('/api/v1/waitlist', $this->payload)->assertCreated();

        Mail::assertSent(WaitlistConfirmation::class, function ($mail) {
            return $mail->hasTo('marina@exemplo.com')
                && $mail->entry->name === 'Marina Alves Souza';
        });
        $this->assertNotNull(WaitlistEntry::first()->confirmed_mail_sent_at);
    }

    public function test_locale_comes_from_the_request_and_sticks(): void
    {
        // A sequência até o lançamento sai muito depois, quando não há mais
        // requisição de onde inferir o idioma — por isso ele é gravado no ato.
        Mail::fake();

        $this->withHeaders(['X-Locale' => 'en'])
            ->postJson('/api/v1/waitlist', $this->payload)->assertCreated();

        $this->assertSame('en', WaitlistEntry::first()->locale);
    }

    public function test_locale_falls_back_to_accept_language(): void
    {
        // Sem X-Locale o SetLocale usa o Accept-Language, que é o que um
        // navegador brasileiro manda. Vale explicitar o header aqui: o cliente
        // de teste do Symfony injeta `Accept-Language: en-us` por conta
        // própria, então "sem header nenhum" não existe neste ambiente e um
        // teste que assumisse isso estaria medindo o Symfony, não o produto.
        Mail::fake();

        $this->withHeaders(['Accept-Language' => 'pt-BR,pt;q=0.9'])
            ->postJson('/api/v1/waitlist', $this->payload)->assertCreated();

        $this->assertSame('pt', WaitlistEntry::first()->locale);
    }

    public function test_subject_differs_for_pros_and_customers(): void
    {
        $cliente = WaitlistEntry::create($this->payload + ['locale' => 'pt']);
        $pro = WaitlistEntry::create(['role' => 'pro', 'name' => 'Rafael Costa',
            'email' => 'rafael@exemplo.com', 'locale' => 'pt']);

        // Quem pede serviço espera notícia da cidade; quem quer trabalhar
        // espera uma ligação. O assunto tem que dizer qual dos dois é.
        $this->assertStringContainsString('lista', (new WaitlistConfirmation($cliente))->envelope()->subject);
        $this->assertStringContainsString('próximo passo', (new WaitlistConfirmation($pro))->envelope()->subject);
    }

    public function test_the_email_renders_with_both_roles_and_locales(): void
    {
        // Mail::fake() não renderiza: um Blade quebrado só apareceria no envio
        // real. Este teste é o que garante que as quatro combinações montam.
        foreach ([['customer', 'pt'], ['customer', 'en'], ['pro', 'pt'], ['pro', 'en']] as [$role, $locale]) {
            $entry = WaitlistEntry::create([
                'role' => $role, 'name' => 'Marina Alves', 'email' => "m-{$role}-{$locale}@exemplo.com",
                'city' => 'Rio Preto', 'locale' => $locale,
            ]);

            $html = (new WaitlistConfirmation($entry))->render();

            $this->assertStringContainsString('Marina', $html, "{$role}/{$locale}");
            $this->assertStringContainsString('wa.me', $html, "{$role}/{$locale}");
            $this->assertStringContainsString('unsubscribe', $html, "{$role}/{$locale}");
        }
    }

    public function test_signed_link_unsubscribes_in_one_click(): void
    {
        $entry = WaitlistEntry::create($this->payload + ['locale' => 'pt']);

        $this->get(URL::signedRoute('waitlist.unsubscribe', ['entry' => $entry->id]))
            ->assertOk()
            ->assertSee('saiu da lista', false);

        $this->assertNotNull($entry->refresh()->unsubscribed_at);
        $this->assertFalse($entry->canBeEmailed());
    }

    public function test_unsigned_link_is_rejected(): void
    {
        // Sem assinatura, trocar o id na URL descadastraria outra pessoa.
        $entry = WaitlistEntry::create($this->payload + ['locale' => 'pt']);

        $this->get("/api/v1/waitlist/{$entry->id}/unsubscribe")->assertForbidden();

        $this->assertNull($entry->refresh()->unsubscribed_at);
    }

    public function test_unsubscribing_twice_is_harmless(): void
    {
        $entry = WaitlistEntry::create($this->payload + ['locale' => 'pt']);
        $url = URL::signedRoute('waitlist.unsubscribe', ['entry' => $entry->id]);

        $this->get($url)->assertOk();
        $primeira = $entry->refresh()->unsubscribed_at;

        $this->get($url)->assertOk();

        // A data da primeira saída é a que vale — clicar de novo não reescreve
        // o histórico de quando a pessoa pediu para sair.
        $this->assertEquals($primeira, $entry->refresh()->unsubscribed_at);
    }
}
