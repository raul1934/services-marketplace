<?php

namespace App\Support\Ops;

use App\Models\ServiceRequest;

/**
 * Como a operação é avisada de que algo precisa de gente.
 *
 * Existe para que trocar o canal seja configuração e não refatoração: hoje o
 * alerta sai por e-mail, no lançamento provavelmente sai por WhatsApp, e o
 * detector não deveria saber a diferença.
 *
 * Regra que vale para toda implementação: **avisar nunca pode quebrar o que
 * disparou o aviso**. Se o canal falhar, registra e segue. Um chamado sem
 * cobertura já é um problema; virar erro 500 no scheduler seria dois.
 */
interface OpsAlerter
{
    /** Um chamado passou do prazo sem receber nenhuma proposta. */
    public function uncoveredRequest(ServiceRequest $request, int $minutes): void;
}
