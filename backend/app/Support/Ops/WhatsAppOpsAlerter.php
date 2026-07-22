<?php

namespace App\Support\Ops;

use App\Models\ServiceRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Alerta por WhatsApp, via Cloud API oficial da Meta.
 *
 * Por que a via oficial e não uma biblioteca não-oficial (Z-API, Evolution,
 * Baileys): as não-oficiais dirigem o WhatsApp Web por baixo dos panos e são
 * exatamente o que faz número ser banido. O canal que existe para avisar a
 * operação não pode ser o que derruba o canal de atendimento.
 *
 * Duas coisas que costumam surpreender:
 *
 * 1. **O número da API não serve mais no aplicativo.** Registrar o número do
 *    suporte aqui significa perdê-lo no celular. Use um número separado —
 *    `CONCIERGE_WA_TO` é para onde o alerta vai, não de onde ele sai.
 * 2. **Fora da janela de 24h só passa template aprovado.** Como o alerta é
 *    iniciado por nós e a qualquer hora, ele é sempre template. O nome e os
 *    parâmetros ficam em config porque quem aprova o template é a Meta, e o
 *    texto muda sem o código mudar.
 */
class WhatsAppOpsAlerter implements OpsAlerter
{
    public function uncoveredRequest(ServiceRequest $request, int $minutes): void
    {
        $cfg = config('concierge.whatsapp');

        if (empty($cfg['token']) || empty($cfg['phone_number_id']) || empty($cfg['to'])) {
            Log::warning('ops_alert.whatsapp.not_configured', ['request_id' => $request->id]);

            return;
        }

        // A ordem importa: são os {{1}}, {{2}}, {{3}} do template aprovado.
        // Mudar aqui sem mudar lá manda o endereço para o lugar do tempo.
        $parametros = [
            (string) $minutes,
            $request->category?->name ?: 'Sem categoria',
            $request->address ?: 'local não informado',
        ];

        try {
            $resposta = Http::withToken($cfg['token'])
                ->timeout(10)
                ->post("https://graph.facebook.com/{$cfg['version']}/{$cfg['phone_number_id']}/messages", [
                    'messaging_product' => 'whatsapp',
                    'to' => preg_replace('/\D/', '', (string) $cfg['to']),
                    'type' => 'template',
                    'template' => [
                        'name' => $cfg['template'],
                        'language' => ['code' => $cfg['template_language']],
                        'components' => [[
                            'type' => 'body',
                            'parameters' => array_map(
                                fn ($valor) => ['type' => 'text', 'text' => $valor],
                                $parametros
                            ),
                        ]],
                    ],
                ]);

            if ($resposta->failed()) {
                Log::error('ops_alert.whatsapp.rejected', [
                    'request_id' => $request->id,
                    'status' => $resposta->status(),
                    // O corpo do erro da Meta diz se é template não aprovado,
                    // token expirado ou número fora da janela — sem ele o
                    // diagnóstico vira adivinhação.
                    'body' => $resposta->json(),
                ]);
            }
        } catch (\Throwable $e) {
            // Ver OpsAlerter: avisar não pode quebrar quem disparou o aviso.
            Log::error('ops_alert.whatsapp.failed', [
                'request_id' => $request->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
