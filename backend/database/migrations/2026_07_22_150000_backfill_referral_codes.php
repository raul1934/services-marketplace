<?php

use App\Models\WaitlistEntry;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Dá código de indicação a quem se inscreveu antes de a indicação existir.
     *
     * O código é gerado no `creating` do modelo, então só vale para inscrições
     * novas. Sem este preenchimento, quem entrou primeiro — justamente os
     * early adopters, os mais propensos a indicar alguém — seria o único grupo
     * incapaz de indicar.
     *
     * Idempotente: mexe só em quem está com o campo nulo, então rodar de novo
     * não reescreve código de ninguém. Código trocado quebraria link já
     * compartilhado.
     */
    public function up(): void
    {
        WaitlistEntry::whereNull('referral_code')
            ->orderBy('id')
            ->chunkById(100, function ($entradas) {
                foreach ($entradas as $entrada) {
                    $entrada->forceFill([
                        'referral_code' => WaitlistEntry::gerarCodigo(),
                    ])->saveQuietly();
                }
            });
    }

    public function down(): void
    {
        // Sem volta de propósito: apagar os códigos quebraria qualquer link que
        // já tenha sido compartilhado, e o ganho seria zero.
    }
};
