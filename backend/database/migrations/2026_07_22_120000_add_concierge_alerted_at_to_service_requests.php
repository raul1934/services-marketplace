<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            // Quando a operação foi avisada de que este chamado não recebeu
            // proposta. Coluna em vez de cache porque serve a duas coisas além
            // de evitar alerta repetido: dá para medir quantos chamados
            // precisaram de resgate (é o inverso da taxa de match) e, mais
            // tarde, alimentar a fila do operador.
            $table->timestamp('concierge_alerted_at')->nullable()->after('no_show_reason');
        });
    }

    public function down(): void
    {
        Schema::table('service_requests', function (Blueprint $table) {
            $table->dropColumn('concierge_alerted_at');
        });
    }
};
