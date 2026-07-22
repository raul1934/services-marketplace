<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/** Mensagem do `php artisan mail:test` — só prova que o envio funciona. */
class TestMessage extends Mailable
{
    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Teste de e-mail — Chama Fácil');
    }

    public function content(): Content
    {
        return new Content(
            htmlString: '<p>Se você está lendo isto, o envio de e-mail está funcionando.</p>'
                .'<p>Enviado por <code>php artisan mail:test</code> em '
                .now()->timezone('America/Sao_Paulo')->format('d/m/Y H:i:s').'.</p>'
        );
    }
}
