<?php

namespace Database\Seeders;

use App\Models\PropertyType;
use Illuminate\Database\Seeder;

/** Seeds the property-type catalog (BR market). Idempotent. */
class PropertyTypeSeeder extends Seeder
{
    private const TYPES = [
        'Apartamento', 'Casa', 'Casa em condomínio', 'Sobrado', 'Cobertura',
        'Kitnet/Studio', 'Flat', 'Sala comercial', 'Loja', 'Galpão',
        'Terreno', 'Chácara/Sítio', 'Fazenda', 'Garagem/Vaga',
    ];

    public function run(): void
    {
        foreach (self::TYPES as $name) {
            PropertyType::firstOrCreate(['name' => $name]);
        }
    }
}
