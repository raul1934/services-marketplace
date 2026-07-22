<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_vehicles', function (Blueprint $table) {
            // Carro ou moto. O sistema inteiro não sabia disso: `vehicle_makes`
            // tem só nome e logo, e o detail do veículo guarda placa, cor, ano,
            // combustível, chassi e km — nada que diga o que está na rua.
            //
            // Não dá para derivar da marca, porque Honda, Suzuki e BMW fazem os
            // dois. E é a informação que decide se o guincho sai com prancha de
            // moto, ou seja: é o que o prestador mais precisa saber antes de
            // aceitar, e era justamente o que ele não tinha.
            //
            // Texto livre em vez de enum porque bicicleta, caminhão e van vão
            // aparecer, e um enum agora vira migration depois.
            $table->string('kind', 24)->nullable()->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('asset_vehicles', function (Blueprint $table) {
            $table->dropColumn('kind');
        });
    }
};
