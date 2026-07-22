<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fila de resgate: profissionais locais pré-qualificados para acionar à mão
     * quando um chamado fica sem proposta (MKT-OPS-01).
     *
     * Não é a mesma coisa que ProviderProfile. Aqui é gente que ainda NÃO está
     * no app — a oficina que você visitou, o guincheiro que topou receber
     * ligação. Vira ProviderProfile quando se cadastra; até lá é o CRM da
     * prospecção que precisa existir de qualquer jeito.
     */
    public function up(): void
    {
        Schema::create('rescue_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('phone', 30);
            $table->string('city', 120);
            $table->string('uf', 2)->nullable();

            // Categorias que a pessoa atende, por slug. Array e não FK porque a
            // fila é anterior ao cadastro: o contato pode fazer algo que ainda
            // não está no catálogo, e perder esse contato por falta de linha em
            // outra tabela seria absurdo.
            $table->json('categories')->nullable();

            // Consentimento. Telefone de MEI é dado pessoal, e a base legal
            // aqui é o consentimento dado na visita — sem registro de quando e
            // como, não há como demonstrar isso depois.
            $table->timestamp('consent_at')->nullable();
            $table->string('consent_source')->nullable();

            $table->boolean('is_active')->default(true);
            $table->unsignedTinyInteger('priority')->default(50);
            $table->text('notes')->nullable();
            $table->timestamp('last_called_at')->nullable();
            $table->timestamps();

            $table->index(['city', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rescue_contacts');
    }
};
