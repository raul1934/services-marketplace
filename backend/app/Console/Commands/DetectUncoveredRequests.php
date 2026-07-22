<?php

namespace App\Console\Commands;

use App\Enums\RequestStatus;
use App\Models\ServiceRequest;
use App\Support\Ops\OpsAlerter;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Avisa a operação de chamados que ficaram sem nenhuma proposta (MKT-OPS-01).
 *
 * Roda antes do requests:expire-stale de propósito: quando aquele comando age,
 * o cliente já desistiu. Aqui a janela ainda é de resgate — alguém pega o
 * telefone, liga para um guincheiro e o chamado vira serviço.
 *
 * O gatilho é a ausência de proposta, não a contagem de prestadores
 * cadastrados: dez guincheiros cadastrados e todos dormindo às 2h da manhã são
 * zero cobertura, e um único prestador acordado pode ser cobertura suficiente.
 * O que importa é o chamado estar sem resposta.
 */
class DetectUncoveredRequests extends Command
{
    protected $signature = 'requests:detect-uncovered';

    protected $description = 'Alerta a operação sobre chamados abertos sem nenhuma proposta';

    public function handle(OpsAlerter $alerta): int
    {
        if (! config('concierge.enabled')) {
            $this->info('Concierge desligado (CONCIERGE_ENABLED).');

            return self::SUCCESS;
        }

        $minutos = (int) config('concierge.minutes_without_proposal', 4);
        $horas = (int) config('concierge.max_age_hours', 6);
        $alertados = 0;

        ServiceRequest::query()
            ->where('status', RequestStatus::Open->value)
            ->whereNull('concierge_alerted_at')
            ->where('created_at', '<=', now()->subMinutes($minutos))
            // Teto de idade. Resgate tem janela: chamado de ontem não é
            // oportunidade, é histórico — e sem isto o primeiro run em produção
            // alertaria de uma vez todo chamado antigo em aberto que já
            // existisse no banco.
            ->where('created_at', '>=', now()->subHours($horas))
            // Chamados dos bots de teste não são cliente nenhum esperando.
            ->where(fn ($q) => $q->where('is_test', false)->orWhereNull('is_test'))
            ->whereDoesntHave('proposals')
            ->with(['client', 'category'])
            ->chunkById(100, function ($chamados) use (&$alertados, $minutos, $alerta) {
                foreach ($chamados as $chamado) {
                    // Marca ANTES de avisar. Se o canal falhar, o pior caso é
                    // um alerta perdido; marcar depois arriscaria reenviar o
                    // mesmo alerta a cada minuto se o envio ficasse instável.
                    $chamado->forceFill(['concierge_alerted_at' => now()])->save();
                    $alertados++;

                    // Qual canal isto vira — e-mail, WhatsApp, os dois — é
                    // decisão de configuração; o detector não sabe e não deve
                    // saber. Nenhuma implementação deixa exceção escapar.
                    $alerta->uncoveredRequest($chamado, $minutos);

                    // Log sempre, independente do canal: é o que permite medir
                    // depois quantos chamados precisaram de resgate — o inverso
                    // direto da taxa de match.
                    Log::warning('concierge.uncovered_request', [
                        'request_id' => $chamado->id,
                        'category' => $chamado->category?->name,
                        'address' => $chamado->address,
                        'minutes_open' => $minutos,
                    ]);
                }
            });

        $this->info("Chamados sem cobertura detectados: {$alertados}.");

        return self::SUCCESS;
    }
}
