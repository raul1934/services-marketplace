<?php

namespace Tests\Feature;

use App\Mail\TestMessage;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TestMailCommandTest extends TestCase
{
    public function test_sends_to_the_given_address(): void
    {
        Mail::fake();

        $this->artisan('mail:test', ['to' => 'raul@exemplo.com'])->assertSuccessful();

        Mail::assertSent(TestMessage::class, fn ($mail) => $mail->hasTo('raul@exemplo.com'));
    }

    public function test_warns_when_the_mailer_only_logs(): void
    {
        Mail::fake();
        config(['mail.default' => 'log']);

        $this->artisan('mail:test', ['to' => 'raul@exemplo.com'])
            ->expectsOutputToContain('ninguém recebe')
            ->assertSuccessful();
    }

    public function test_warns_when_sender_does_not_match_the_authenticated_mailbox(): void
    {
        // O modo de falha mais caro de diagnosticar: o envio é aceito, o
        // servidor não reclama, e a mensagem cai em spam porque SPF/DKIM não
        // alinham. Melhor gritar antes de tentar.
        Mail::fake();
        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.username' => 'adm@chamafacil.app',
            'mail.from.address' => 'contato@outrodominio.com',
        ]);

        $this->artisan('mail:test', ['to' => 'raul@exemplo.com'])
            ->expectsOutputToContain('diferente da caixa autenticada')
            ->assertSuccessful();
    }

    public function test_reports_failure_instead_of_throwing(): void
    {
        Mail::shouldReceive('to->send')->andThrow(new \RuntimeException('Connection refused'));

        $this->artisan('mail:test', ['to' => 'raul@exemplo.com'])
            ->expectsOutputToContain('Connection refused')
            ->assertFailed();
    }
}
