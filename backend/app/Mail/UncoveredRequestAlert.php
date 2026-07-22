<?php

namespace App\Mail;

use App\Models\RescueContact;
use App\Models\ServiceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Avisa a operação de que um chamado ficou sem nenhuma proposta.
 *
 * É um e-mail e não uma mensagem no app de propósito: quem precisa agir não
 * está olhando o painel às 2h da manhã, e e-mail chega no celular de todo mundo
 * sem depender de integração nova. O corpo carrega tudo que a pessoa precisa
 * para ligar sem abrir mais nada — categoria, endereço, orçamento e o telefone
 * do cliente.
 */
class UncoveredRequestAlert extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public ServiceRequest $request, public int $minutes) {}

    public function envelope(): Envelope
    {
        $categoria = $this->request->category?->name ?? 'Sem categoria';
        $cidade = $this->request->address ?: 'local não informado';

        // O assunto é lido na notificação do celular, muitas vezes sem abrir o
        // e-mail. Ele sozinho já tem que dizer o que fazer.
        return new Envelope(
            subject: "🚨 Chamado sem proposta há {$this->minutes} min — {$categoria} · {$cidade}"
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.uncovered-request',
            with: [
                'request' => $this->request,
                'minutes' => $this->minutes,
                // A fila de resgate vai DENTRO do alerta, não num painel: quem
                // precisa agir está no celular às 2h da manhã, e cada tela a
                // mais entre o alerta e a ligação é tempo que o cliente passa
                // esperando. Cinco é o que cabe numa tela sem virar lista.
                'contatos' => RescueContact::query()
                    // Sem filtro de cidade: `service_requests` não guarda
                    // cidade — só endereço e coordenadas — e a operação é de uma
                    // praça só. Quando abrir a segunda, o filtro sai do Market
                    // do chamado, que é onde a territorialidade já vive.
                    ->paraChamado(null, $this->request->category?->slug)
                    ->limit(5)
                    ->get(),
                'adminUrl' => rtrim((string) config('concierge.admin_url'), '/')
                    ."/admin/service-requests/{$this->request->id}",
            ],
        );
    }
}
