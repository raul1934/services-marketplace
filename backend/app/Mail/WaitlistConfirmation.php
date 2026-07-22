<?php

namespace App\Mail;

use App\Models\WaitlistEntry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

/**
 * Confirmação imediata de entrada na lista de espera (MKT-CRO-02).
 *
 * Antes disto, o lead entrava e não recebia nada. Sem confirmação, o endereço
 * nunca é validado, a expectativa não é definida e a pessoa esquece que se
 * cadastrou — de modo que a base captada até o lançamento chegava fria no dia
 * em que ela mais importa.
 *
 * Vai para a fila (ShouldQueue) para que uma falha de SMTP não derrube o POST
 * do formulário: perder o e-mail é ruim, perder o lead é pior.
 */
class WaitlistConfirmation extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public WaitlistEntry $entry) {}

    public function envelope(): Envelope
    {
        $pro = $this->entry->isPro();
        $en = $this->entry->locale === 'en';

        return new Envelope(
            subject: $pro
                ? ($en ? 'Your Chama Fácil sign-up — next step' : 'Seu cadastro na Chama Fácil — próximo passo')
                : ($en ? "You're on the Chama Fácil list" : 'Você está na lista da Chama Fácil')
        );
    }

    /**
     * Cabeçalhos de descadastro em um clique (RFC 8058).
     *
     * Desde 2024 o Gmail e o Yahoo exigem isto de quem envia em volume, e a
     * ausência conta como sinal negativo mesmo em volume baixo — que é
     * exatamente a situação de um domínio novo, sem histórico, mandando o
     * primeiro e-mail da vida. É o mesmo link assinado do rodapé; a diferença é
     * que aqui o provedor consegue lê-lo e oferecer o botão nativo de
     * "cancelar inscrição", em vez de deixar a pessoa marcar como spam — que é
     * o que de fato destrói reputação.
     *
     * List-Unsubscribe-Post é o que torna o clique único: sem ele o provedor
     * abre a URL num navegador em vez de resolver sozinho.
     */
    public function headers(): Headers
    {
        $url = URL::signedRoute('waitlist.unsubscribe', ['entry' => $this->entry->id]);

        return new Headers(text: [
            'List-Unsubscribe' => "<{$url}>",
            'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
        ]);
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.waitlist-confirmation',
            // Sem esta linha a mensagem sai só em HTML, o que conta contra em
            // filtro de spam e deixa de fora quem lê em cliente sem HTML.
            text: 'mail.waitlist-confirmation-text',
            with: [
                'entry' => $this->entry,
                'en' => $this->entry->locale === 'en',
                'whatsapp' => config('concierge.public_whatsapp'),
                // Link assinado: não dá para descadastrar outra pessoa mexendo
                // no id da URL, e não exige login de quem só quer sair.
                'unsubscribeUrl' => URL::signedRoute('waitlist.unsubscribe', ['entry' => $this->entry->id]),
            ],
        );
    }
}
