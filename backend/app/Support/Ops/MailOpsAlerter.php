<?php

namespace App\Support\Ops;

use App\Mail\UncoveredRequestAlert;
use App\Models\ServiceRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Alerta por e-mail. É o canal padrão porque não depende de integração nenhuma
 * e chega no celular de todo mundo — inclusive às 2h da manhã, que é justamente
 * quando um chamado de guincho fica sem resposta.
 */
class MailOpsAlerter implements OpsAlerter
{
    public function uncoveredRequest(ServiceRequest $request, int $minutes): void
    {
        $destino = config('concierge.alert_email');

        if (! $destino) {
            Log::warning('ops_alert.mail.no_recipient', ['request_id' => $request->id]);

            return;
        }

        try {
            Mail::to($destino)->send(new UncoveredRequestAlert($request, $minutes));
        } catch (\Throwable $e) {
            // Ver OpsAlerter: avisar não pode quebrar quem disparou o aviso.
            Log::error('ops_alert.mail.failed', [
                'request_id' => $request->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
