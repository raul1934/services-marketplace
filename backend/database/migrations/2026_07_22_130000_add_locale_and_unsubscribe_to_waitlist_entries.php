<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('waitlist_entries', function (Blueprint $table) {
            // Idioma em que a pessoa se cadastrou. Guardado no ato porque a
            // sequência até o lançamento vai sair muito depois, quando não há
            // mais requisição nenhuma de onde inferir isso.
            $table->string('locale', 5)->default('pt')->after('service');

            // Descadastro. A política de privacidade publicada promete "link de
            // descadastro em um clique" — sem esta coluna a promessa seria
            // falsa, e é uma promessa que a LGPD cobra.
            $table->timestamp('unsubscribed_at')->nullable()->after('locale');

            // Confirmação enviada. Evita reenvio se o job for reprocessado.
            $table->timestamp('confirmed_mail_sent_at')->nullable()->after('unsubscribed_at');
        });
    }

    public function down(): void
    {
        Schema::table('waitlist_entries', function (Blueprint $table) {
            $table->dropColumn(['locale', 'unsubscribed_at', 'confirmed_mail_sent_at']);
        });
    }
};
