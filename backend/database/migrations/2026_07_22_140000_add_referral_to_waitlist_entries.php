<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('waitlist_entries', function (Blueprint $table) {
            // Código de indicação de quem entrou. Curto porque vai ser digitado
            // e ditado em conversa de WhatsApp, não só clicado.
            $table->string('referral_code', 12)->nullable()->unique()->after('locale');

            // Quem indicou. nullOnDelete e não cascade: se o indicador pedir
            // exclusão dos dados, o indicado não pode sumir junto — ele não tem
            // nada a ver com aquilo, e o crédito dele continua devido.
            $table->foreignId('referred_by_id')->nullable()->after('referral_code')
                ->constrained('waitlist_entries')->nullOnDelete();

            // Quando o crédito prometido foi de fato concedido. Nulo enquanto
            // pendente — é a lista do que ainda devemos quando a praça abrir.
            $table->timestamp('referral_credit_granted_at')->nullable()->after('referred_by_id');

            $table->index('referred_by_id');
        });
    }

    public function down(): void
    {
        Schema::table('waitlist_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referred_by_id');
            $table->dropColumn(['referral_code', 'referral_credit_granted_at']);
        });
    }
};
