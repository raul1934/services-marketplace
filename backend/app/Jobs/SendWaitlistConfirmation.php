<?php

namespace App\Jobs;

use App\Mail\WaitlistConfirmation;
use App\Models\WaitlistEntry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

/**
 * Envia a confirmação da lista de espera — uma vez só, mesmo se o job repetir.
 *
 * ## Por que este job existe
 *
 * Todo job de fila pode rodar duas vezes. Não é hipótese: se o processo morrer
 * depois do efeito e antes de o job ser marcado concluído — OOM, servidor
 * reiniciando, SIGKILL —, o registro segue reservado, o `retry_after` vence e
 * outro worker o pega DESDE O INÍCIO.
 *
 * Antes, o controller marcava `confirmed_mail_sent_at` no DESPACHO. Isso não
 * protegia nada: a marca era gravada antes de o e-mail existir, e a repetição
 * mandava um segundo e-mail para a mesma pessoa.
 *
 * ## O padrão: reivindicação atômica antes do efeito
 *
 * O `UPDATE ... WHERE confirmed_mail_sent_at IS NULL` é atômico no banco: dois
 * workers competindo pelo mesmo registro, só um recebe 1 linha afetada. Quem
 * recebe zero já sabe que outro está cuidando e sai sem fazer nada.
 *
 * A reivindicação vem ANTES do envio de propósito. Marcar depois deixaria a
 * janela aberta justamente no trecho demorado — a conversa SMTP — que é onde a
 * chance de morrer no meio se concentra.
 *
 * Se o envio falhar, a marca é devolvida e a exceção sobe: aí o retry normal da
 * fila acontece, com o registro livre de novo.
 *
 * ## Quando copiar este padrão
 *
 * Para efeito que não pode acontecer duas vezes e cabe numa coluna do próprio
 * registro. Para dinheiro — repasse, cobrança, estorno — a coluna não basta: aí
 * é chave de idempotência por operação, que é o que o gateway vai exigir de
 * qualquer forma. Ver a issue MKT/#168.
 */
class SendWaitlistConfirmation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public int $entryId) {}

    public function handle(): void
    {
        // Reivindica. Zero linhas = outra execução já cuidou disto.
        $reivindicou = WaitlistEntry::whereKey($this->entryId)
            ->whereNull('confirmed_mail_sent_at')
            ->update(['confirmed_mail_sent_at' => now()]);

        if ($reivindicou === 0) {
            return;
        }

        $entry = WaitlistEntry::find($this->entryId);

        // Quem pediu para sair não recebe nem a confirmação. A entrada some da
        // fila entre o cadastro e o envio quando a pessoa clica em descadastrar
        // no e-mail de outra inscrição — raro, mas o custo de checar é zero.
        if (! $entry || ! $entry->canBeEmailed()) {
            return;
        }

        try {
            Mail::to($entry->email)->send(new WaitlistConfirmation($entry));
        } catch (\Throwable $e) {
            // Devolve a reivindicação para o retry da fila poder tentar de novo.
            WaitlistEntry::whereKey($this->entryId)
                ->update(['confirmed_mail_sent_at' => null]);

            throw $e;
        }
    }
}
