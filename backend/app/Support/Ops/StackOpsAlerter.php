<?php

namespace App\Support\Ops;

use App\Models\ServiceRequest;

/**
 * Vários canais ao mesmo tempo.
 *
 * Serve à transição: durante o período em que o WhatsApp está sendo validado,
 * dá para manter o e-mail ligado junto e conferir se os dois chegam, sem
 * apostar a operação num canal que ainda não provou funcionar.
 *
 * Um canal que falha não impede os outros — é o motivo de cada implementação
 * engolir a própria exceção.
 */
class StackOpsAlerter implements OpsAlerter
{
    /** @param  array<int, OpsAlerter>  $canais */
    public function __construct(private array $canais) {}

    public function uncoveredRequest(ServiceRequest $request, int $minutes): void
    {
        foreach ($this->canais as $canal) {
            $canal->uncoveredRequest($request, $minutes);
        }
    }
}
